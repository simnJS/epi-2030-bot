import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import {
	ChatInputCommandInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ContainerBuilder,
	TextDisplayBuilder,
	MessageFlags,
	GuildMember
} from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'idea',
	description: 'Suggest an idea for the bot and let the community vote on it',
	preconditions: ['IdeaChannelOnly']
})
export class IdeaCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) => option.setName('title').setDescription('Title of your idea').setRequired(true))
					.addStringOption((option) => option.setName('description').setDescription('Describe your idea').setRequired(true))
					.addIntegerOption((option) =>
						option.setName('duration').setDescription('Voting duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080)
					),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		try {
			const idea = interaction.options.getString('title');
			const description = interaction.options.getString('description', true);
			const duration = interaction.options.getInteger('duration') || 1;
			const member = (await interaction.guild?.members.fetch(interaction.user.id)) as GuildMember;

			if (duration <= 0) {
				const component = [
					new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Duration must be a positive integer`))
				];
				await interaction.reply({
					components: component,
					flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
				});
				return;
			}

			if (duration >= 10080) {
				const component = [
					new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Duration cant be more than a week`))
				];
				await interaction.reply({
					components: component,
					flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
				});
				return;
			}

			const userId = interaction.user.id;
			const now = new Date();
			const endTime = new Date(now.getTime() + duration * 60 * 1000);

			try {
				const activeIdea = await this.container.prisma.idea.findFirst({
					where: {
						authorId: userId,
						isActive: true,
						endTime: {
							gt: now
						}
					}
				});

				if (activeIdea) {
					const component = [
						new ContainerBuilder().addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`### You already have an active idea being voted on. Please wait until the current vote ends before submitting a new idea`
							)
						)
					];
					await interaction.reply({
						components: component,
						flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
					});
					return;
				}
			} catch (error) {
				this.container.logger.error('Database error checking active ideas:', error);
				const component = [
					new ContainerBuilder().addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`### Database error. Please try again later.`)
					)
				];
				await interaction.reply({
					components: component,
					flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
				});
				return;
			}

			const upvoteButton = new ButtonBuilder().setCustomId('idea_upvote').setLabel('👍 • 0').setStyle(ButtonStyle.Success);
			const downvoteButton = new ButtonBuilder().setCustomId('idea_downvote').setLabel('👎 • 0').setStyle(ButtonStyle.Danger);

			const components = [
				new ContainerBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`## 💡 ${idea}\n\n### ${description}\n*Suggested by ${member.displayName}*`)
					)
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton))
					.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# *Ends <t:${Math.floor(endTime.getTime() / 1000)}:R>*`))
			];

			await interaction.reply({
				components: components,
				flags: MessageFlags.IsComponentsV2
			});

			const message = await interaction.fetchReply();

			try {
				await this.container.prisma.idea.create({
					data: {
						title: idea!,
						description: description,
						authorId: userId,
						authorName: member.displayName,
						messageId: message.id,
						duration: duration,
						endTime: endTime
					}
				});
			} catch (error) {
				this.container.logger.error('Failed to save idea to database:', error);
			}
		} catch (error) {
			this.container.logger.error('Error in idea command:', error);

			if (!interaction.replied && !interaction.deferred) {
				try {
					const component = [
						new ContainerBuilder().addTextDisplayComponents(
							new TextDisplayBuilder().setContent(`### An error occurred. Please try again later.`)
						)
					];
					await interaction.reply({
						components: component,
						flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
					});
				} catch (replyError) {
					this.container.logger.error('Failed to send error message:', replyError);
				}
			}
		}
	}
}
