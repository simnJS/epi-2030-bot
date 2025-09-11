import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { MessageFlags, ContainerBuilder, TextDisplayBuilder, TextChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'resume',
	description: 'Generate a summary of the last 100 messages in this channel using GPT-4'
})
export class ResumeCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, options);
	}

	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addIntegerOption((option) =>
						option
							.setName('messages')
							.setDescription('Number of messages to summarize (1-100)')
							.setRequired(false)
							.setMinValue(1)
							.setMaxValue(100)
					)
					.addBooleanOption((option) =>
						option.setName('ephemere').setDescription('Show summary only to you (true) or to everyone (false)').setRequired(false)
					),
			{
				guildIds: ['1391769906944409662']
			}
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		try {
			const messageCount = interaction.options.getInteger('messages') || 100;
			const isEphemeral = interaction.options.getBoolean('ephemere') ?? true;

			const loadingComponent = [
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### 📝 Analyzing the last ${messageCount} messages...\n*This may take a few moments*`)
				)
			];

			const replyFlags = isEphemeral ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral : MessageFlags.IsComponentsV2;

			await interaction.reply({
				components: loadingComponent,
				flags: replyFlags
			});

			const channel = interaction.channel as TextChannel;
			if (!channel) {
				throw new Error('Could not access channel');
			}

			const messages = await channel.messages.fetch({ limit: messageCount });
			const messageArray = Array.from(messages.values()).reverse();

			if (messageArray.length === 0) {
				const noMessagesComponent = [
					new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ❌ No messages found in this channel`))
				];
				await interaction.editReply({
					components: noMessagesComponent,
					flags: [MessageFlags.IsComponentsV2]
				});
				return;
			}

			const messageText = messageArray
				.filter((msg) => !msg.author.bot && msg.content.length > 0)
				.map((msg) => `[${msg.author.displayName || msg.author.username} (${msg.author.id})]: ${msg.content}`)
				.join('\n');

			if (messageText.length === 0) {
				const noContentComponent = [
					new ContainerBuilder().addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`### ❌ No meaningful message content found to summarize`)
					)
				];
				await interaction.editReply({
					components: noContentComponent,
					flags: [MessageFlags.IsComponentsV2]
				});
				return;
			}

			const completion = await this.container.openai.chat.completions.create({
				model: 'gpt-5-nano',
				messages: [
					{
						role: 'system',
						content:
							'Tu es un assistant qui crée des résumés TRÈS concis de conversations Discord. Identifie uniquement LE sujet principal le plus important de la conversation et résume-le en 2-3 phrases maximum. Ignore les discussions secondaires, les blagues, et les détails non essentiels. Concentre-toi seulement sur les décisions importantes ou les informations cruciales. IMPORTANT: Quand tu mentionnes une personne, utilise le format <@userid>.'
					},
					{
						role: 'user',
						content: `Crée un résumé de cette conversation Discord. Voici les messages avec format [nom d'utilisateur (userid)]: message :\n\n${messageText}`
					}
				],
				max_completion_tokens: 50000,
				verbosity: 'medium'
			});

			const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';

			const summaryComponent = [
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`## 📋 Channel Summary\n\n${summary}\n\n*Summary of ${messageArray.filter((msg) => !msg.author.bot && msg.content.length > 0).length} messages*`
					)
				)
			];

			await interaction.editReply({
				components: summaryComponent,
				flags: replyFlags
			});
		} catch (error) {
			this.container.logger.error('Error in resume command:', error);

			try {
				const errorComponent = [
					new ContainerBuilder().addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`### ❌ An error occurred while generating the summary\n*Please make sure OpenAI API key is configured*`
						)
					)
				];
				await interaction.editReply({
					components: errorComponent,
					flags: [MessageFlags.IsComponentsV2]
				});
			} catch (replyError) {
				this.container.logger.error('Failed to send error message:', replyError);
			}
		}
	}
}
