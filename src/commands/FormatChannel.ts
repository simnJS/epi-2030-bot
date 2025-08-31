import { ApplyOptions } from "@sapphire/decorators";
import { Awaitable, Command } from "@sapphire/framework";
import { TextChannel } from "discord.js";




@ApplyOptions<Command.Options>({
    description: "A command to format the name of the channel using openAI"
})
export class FormatChannelCommand extends Command {
    public override registerApplicationCommands(registry : Command.Registry): Awaitable<void> {

        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName("format-channel")
                    .setDescription(this.description),
                    

                { guildIds: ["1391769906944409662"]}
        )   
    }

    public override async chatInputRun(interaction : Command.ChatInputCommandInteraction) {

        const channel = interaction.channel as TextChannel;

        if (!channel) {
            return interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
        }

        const newChannelName = await this.getChannelName(channel.name);

        await channel.setName(newChannelName).catch(() => {});

        await interaction.reply({ content: `The channel has been renamed to: ${newChannelName}`, ephemeral: true });

        return;
    }

    private async getChannelName(channelName: string): Promise<string> {

        const response = await this.container.openai.responses.create({
            prompt: {
                "id": "pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a",
                "version": "8"
            },
            input: channelName
        });

        return response.output_text
    }

}