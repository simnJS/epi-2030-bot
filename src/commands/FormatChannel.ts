import { ApplyOptions } from "@sapphire/decorators";
import { Awaitable, Command } from "@sapphire/framework";
import { GuildChannel, EmbedBuilder } from "discord.js";




@ApplyOptions<Command.Options>({
    description: "A command to format the name of the channel/category using openAI"
})
export class FormatChannelCommand extends Command {
    public override registerApplicationCommands(registry : Command.Registry): Awaitable<void> {

        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName("format-channel")
                    .setDescription(this.description)
                    .addChannelOption(option =>
                        option.setName('channel')
                            .setDescription('The channel to format')
                            .setRequired(false)
                    ),
                { guildIds: ["1391769906944409662"]}
        )   
    }

    public override async chatInputRun(interaction : Command.ChatInputCommandInteraction) {

        const channel = interaction.options.getChannel('channel') as GuildChannel ?? (interaction.channel as GuildChannel)

        if (!channel) {
            const embedfail = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("Channel not found or cant be rename")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
            return interaction.reply({embeds: [embedfail]});
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

        const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("Channel name update")
                .setDescription('The new channel name is: '+ channel.name)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
        return interaction.reply({embeds: [embed]});
    }

    private async getChannelTextName(channelName: string): Promise<string> {

        // const response = await this.container.openai.responses.create({
        //     prompt: {
        //         "id": "pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a",
        //         "version": "8"
        //     },
        //     input: channelName
        // });

        // return response.output_text

        return "☑️・" + channelName.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9\-]/g, "");
    }

    private async getChannelVoiceName(channelName: string): Promise<string> {

        // const response = await this.container.openai.responses.create({
        //     prompt: {
        //         "id": "pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a",
        //         "version": "8"
        //     },
        //     input: channelName
        // });

        // return response.output_text

        return "☑️・" + channelName;
    }

    private async getCategoryName(channelName: string): Promise<string> {

        // const response = await this.container.openai.responses.create({
        //     prompt: {
        //         "id": "pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a",
        //         "version": "8"
        //     },
        //     input: channelName
        // });

        // return response.output_text

        return "☑️ | Ça " + channelName + " | ☑️";
    }

    private async getOtherName(channelName: string): Promise<string> {

        // const response = await this.container.openai.responses.create({
        //     prompt: {
        //         "id": "pmpt_68b4aaab989c8194980e03e015bc31b70e52bc487cd0697a",
        //         "version": "8"
        //     },
        //     input: channelName
        // });

        // return response.output_text

        return "☑️・" + channelName;
    }

}