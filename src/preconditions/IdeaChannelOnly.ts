import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class IdeaChannelOnlyPrecondition extends Precondition {
	public override async chatInputRun(interaction: CommandInteraction) {
		return this.checkIdeaChannel(interaction.channelId);
	}

	private async checkIdeaChannel(channelId: string) {
		return channelId === '1411791633296396328'
			? this.ok()
			: this.error({ message: 'This command can only be used in the following channel: <#1411791633296396328>' });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		IdeaChannelOnly: never;
	}
}

export default undefined;
