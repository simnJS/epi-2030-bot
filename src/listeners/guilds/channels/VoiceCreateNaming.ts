import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { EmbedBuilder, GuildChannel, TextChannel } from "discord.js";


@ApplyOptions<Listener.Options>({
    event: Events.ChannelCreate
})
export class VoiceCreateNamingListener extends Listener<typeof Events.ChannelCreate> {

    public async run(channel: GuildChannel) {

        if (channel.type == 2) {
            const beforeEmbed = new EmbedBuilder()
            .setTitle("Generating channel name")
			.setColor("DarkRed")
            .setDescription("Please wait while I generate the correct name for the new channel...")

            const message = await (channel as TextChannel).send({embeds: [beforeEmbed]});

            const ChannelName = await this.getChannelName(channel.name);

            await channel.setName(ChannelName).catch(() => {});

            await message.edit({embeds: [new EmbedBuilder()
                .setTitle("Channel name generated")
                .setColor("Green")
                .setDescription(`The new voice channel name is: ${ChannelName}`)
            ]});
        }
    }

    private async getChannelName(channelName: string): Promise<string> {

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