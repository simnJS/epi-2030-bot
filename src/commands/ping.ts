import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'ping',
	description: "Ping command to check the bot's responsiveness"
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand((builder) => builder
		.setName(this.name)
		.setDescription(this.description), {
			guildIds: ['1391769906944409662']
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {

		const componentlatency = [
			new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### Calculating...`)
                )
		]
		const sent = await interaction.reply({
                components : componentlatency,
                flags: [MessageFlags.IsComponentsV2],
				fetchReply: true
        })
		const latency = sent.createdTimestamp - interaction.createdTimestamp
		const apiPing = this.container.client.ws.ping

		const component = [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### Bot Latency\nAPI Ping: ${apiPing}ms\nChat Latency: ${latency}ms`)
                )
        ]
        await interaction.editReply({
                components : component,
                flags: [MessageFlags.IsComponentsV2]
        });
	}
}
