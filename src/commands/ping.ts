import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: "Ping command to check the bot's responsiveness"
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand((builder) => builder.setName('ping').setDescription(this.description), {
			guildIds: ['1391769906944409662']
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const embed = new EmbedBuilder()
			.setTitle('Bot Latency')
			.setColor('Blue')
			.setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false }) });

		const message = await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

		const wsPing = this.container.client.ws.ping;
		const apiPing = message.createdTimestamp - interaction.createdTimestamp;

		await interaction.editReply({
			embeds: [embed.setDescription(`WebSocket Ping: ${wsPing}ms\nAPI Ping: ${apiPing}ms`)]
		});
	}
}
