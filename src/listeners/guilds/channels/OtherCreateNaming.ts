import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { GuildChannel } from "discord.js";


@ApplyOptions<Listener.Options>({
    event: Events.ChannelCreate
})
export class OtherCreateNamingListener extends Listener<typeof Events.ChannelCreate> {

    public async run(channel: GuildChannel) {

        if (channel.type != 0 && channel.type != 2 && channel.type != 4) {
            const ChannelName = await this.getChannelName(channel.name);

            await channel.setName(ChannelName).catch(() => {});
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