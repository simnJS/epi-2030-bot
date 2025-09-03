// To implent : DB to save ideas or simply a json or discord channel to log them

import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, ContainerComponent, ActionRow, ButtonComponent } from 'discord.js';

const activeIdeas = new Map<string, number>(); // userId -> endTime

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
					.addIntegerOption((option) => option.setName('duration').setDescription('Voting duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080)),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const idea = interaction.options.getString('title');
		const description = interaction.options.getString('description', true);
		const duration = interaction.options.getInteger('duration') || 1;

		if (duration <= 0) {
			const component = [
				new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### Duration must be a positive integer`)
				)
			]
			await interaction.reply({
				components : component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		if (duration >= 10080) {
			const component = [
				new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### Duration cant be more than a week`)
				)
			]
			await interaction.reply({
				components : component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		const voteDurationMs = duration * 60 * 1000;
		const endTime = Date.now() + voteDurationMs;

		const userId = interaction.user.id;
		const now = Date.now();

		// Verify if user already has an active idea
		if (activeIdeas.has(userId) && activeIdeas.get(userId)! > now) {

			const component = [
				new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### You already have an active idea being voted on. Please wait until the current vote ends before submitting a new idea`)
				)
			]
			await interaction.reply({
				components : component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		// Save the idea as active
		activeIdeas.set(userId, now + voteDurationMs);

		const upvoteButton = new ButtonBuilder().setCustomId('idea_upvote').setLabel('👍 • 0').setStyle(ButtonStyle.Success);
		const downvoteButton = new ButtonBuilder().setCustomId('idea_downvote').setLabel('👎 • 0').setStyle(ButtonStyle.Danger);

		const components = [
			new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`## 💡 ${idea}\n\n### ${description}\n*Suggested by ${interaction.user.username}*`)
				)
				.addActionRowComponents(
					new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton)
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`-# *Ends <t:${Math.floor(endTime / 1000)}:R>*`)
				)
		];

		await interaction.reply({
			components : components,
			flags: MessageFlags.IsComponentsV2
		});

		const message = await interaction.fetchReply();


		// End vote after duration
		setTimeout(async () => {
            // Re-fetch the message to get the latest component values
            const updatedMessage = await message.fetch();

            const container = updatedMessage.components[0] as ContainerComponent;
			const buttonscontainer = container.components[1] as ActionRow<ButtonComponent>;

            const upvotes = parseInt((buttonscontainer.components[0].label ?? '0').replace(/\D/g, ''), 10) || 0;
			const downvotes = parseInt((buttonscontainer.components[1].label ?? '0').replace(/\D/g, ''), 10) || 0;

			console.log(upvotes, downvotes)

            const upvoteButtonFinal = new ButtonBuilder().setCustomId('idea_upvote').setLabel(`👍 • ${upvotes}`).setStyle(ButtonStyle.Secondary).setDisabled(true);
            const downvoteButtonFinal = new ButtonBuilder().setCustomId('idea_downvote').setLabel(`👎 • ${downvotes}`).setStyle(ButtonStyle.Secondary).setDisabled(true);

            const resultMsg =
                upvotes <= downvotes
                    ? "Members of the promo said no, your idea won't be added to the bot"
                    : 'Members of the promo said yes, you can add the feature to the bot !';

            const finalComponents = [
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 💡 ${idea}\n\n### ${description}\n*Suggested by ${interaction.user.username}*`)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButtonFinal, downvoteButtonFinal)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`### ${resultMsg}\n-# *Vote ended <t:${Math.floor(endTime / 1000)}:R>*`)
                    )
                ];

            try {
                await message.edit({
                    components: finalComponents,
                    flags: MessageFlags.IsComponentsV2
                });
            } catch {}

            activeIdeas.delete(userId);
        }, voteDurationMs);
	}
}
