import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, type ButtonInteraction } from 'discord.js';

type VoteType = 'up' | 'down';

export class IdeaButtonHandler extends InteractionHandler {
	private voteData = new Map<string, Map<string, VoteType>>();

	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('idea_')) return this.none();
		return this.some();
	}

	public async run(interaction: ButtonInteraction) {
		const { message, user, customId } = interaction;
		const embed = message.embeds[0];

		if (!embed) return;

		const voteType = this.getVoteType(customId);
		if (!voteType) return;

		const { upvotes, downvotes, changed } = this.processVote(message.id, user.id, voteType, embed);

		await this.replyToUser(interaction, voteType, changed);

		if (changed) {
			await this.updateEmbed(message, embed, upvotes, downvotes);
		}
	}

	private getVoteType(customId: string): VoteType | null {
		if (customId === 'idea_upvote') return 'up';
		if (customId === 'idea_downvote') return 'down';
		return null;
	}

	private processVote(messageId: string, userId: string, voteType: VoteType, embed: any) {
		const votes = this.voteData.get(messageId) || new Map<string, VoteType>();
		const prevVote = votes.get(userId);

		let upvotes = parseInt(embed.fields?.[0]?.value || '0');
		let downvotes = parseInt(embed.fields?.[1]?.value || '0');
		let changed = false;

		if (prevVote !== voteType) {
			if (prevVote === 'up') upvotes--;
			if (prevVote === 'down') downvotes--;

			if (voteType === 'up') upvotes++;
			if (voteType === 'down') downvotes++;

			votes.set(userId, voteType);
			this.voteData.set(messageId, votes);
			changed = true;
		}

		return { upvotes, downvotes, changed };
	}

	private async replyToUser(interaction: ButtonInteraction, voteType: VoteType, changed: boolean) {
		const voteLabel = voteType === 'up' ? '👍 For' : '👎 Against';
		const content = changed
			? `Your vote "${voteLabel}" has been recorded!`
			: 'You already voted. You can change your vote by clicking the other button';

		await interaction.reply({ content, ephemeral: true });
	}

	private async updateEmbed(message: any, originalEmbed: any, upvotes: number, downvotes: number) {
		const newEmbed = EmbedBuilder.from(originalEmbed).setFields([
			{ name: '👍 For', value: upvotes.toString(), inline: true },
			{ name: '👎 Against', value: downvotes.toString(), inline: true },
			originalEmbed.fields?.[2] || { name: '⏳ Ends', value: 'Soon', inline: true }
		]);

		try {
			await message.edit({ embeds: [newEmbed] });
		} catch {}
	}
}
