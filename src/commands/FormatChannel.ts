import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { GuildChannel, MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'format-channel',
	description: 'A command to format the name of the channel/category using openAI'
})
export class FormatChannelCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addChannelOption((option) => option.setName('channel').setDescription('The channel to format').setRequired(false)),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const channel = (interaction.options.getChannel('channel') as GuildChannel) ?? (interaction.channel as GuildChannel);

		if (!channel) {
			const component = [
				new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Channel not found or cant be rename`))
			];
			await interaction.reply({
				components: component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		let newChannelName = channel.name;
		if (channel.type == 0) {
			newChannelName = await this.getChannelTextName(channel.name);
		} else if (channel.type == 2) {
			newChannelName = await this.getChannelVoiceName(channel.name);
		} else if (channel.type == 4) {
			newChannelName = await this.getCategoryName(channel.name);
		} else {
			newChannelName = await this.getOtherName(channel.name);
		}

		await channel.setName(newChannelName).catch();

		const component = [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### Channel name update\nThe new channel name is: ${channel.name}`)
			)
		];
		return interaction.reply({
			components: component,
			flags: [MessageFlags.IsComponentsV2]
		});
	}

	private async getChannelTextName(channelName: string): Promise<string> {
		const response = await this.container.openai.responses.create({
			prompt: {
				id: 'pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a',
				version: '8'
			},
			input: channelName
		});

		return response.output_text;
	}

	private async getChannelVoiceName(channelName: string): Promise<string> {
		const response = await this.container.openai.responses.create({
			prompt: {
				id: 'pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a',
				version: '8'
			},
			input: channelName
		});

		return response.output_text;
	}

	private async getCategoryName(channelName: string): Promise<string> {
		const response = await this.container.openai.responses.create({
			prompt: {
				id: 'pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a',
				version: '8'
			},
			input: channelName
		});

		return response.output_text;
	}

	private async getOtherName(channelName: string): Promise<string> {
		const response = await this.container.openai.responses.create({
			prompt: {
				id: 'pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a',
				version: '8'
			},
			input: channelName
		});

		return response.output_text;
	}
}
