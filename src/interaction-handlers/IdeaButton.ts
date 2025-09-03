import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ContainerBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, type ButtonInteraction, MessageFlags } from 'discord.js';

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
		const container = message.components[0];

		if (!container) return;

		const voteType = this.getVoteType(customId);
		if (!voteType) return;

		const currentContent = this.extractCurrentVotes(container);
		const { upvotes, downvotes, changed } = this.processVoteFromContainer(message.id, user.id, voteType, currentContent);

		await this.replyToUser(interaction, voteType, changed);

		if (changed) {
			await this.updateContainer(message, currentContent, upvotes, downvotes);
		}
	}

	private getVoteType(customId: string): VoteType | null {
		if (customId === 'idea_upvote') return 'up';
		if (customId === 'idea_downvote') return 'down';
		return null;
	}

	private extractCurrentVotes(container: any): { upvotes: number; downvotes: number; text: string; end: string} {
		
		const text = container.components[0].data.content
		const end = container.components[2].data.content
		const upvotes = parseInt((container.components[1].components[0].label ?? '0').replace(/\D/g, ''), 10) || 0;
		const downvotes = parseInt((container.components[1].components[1].label ?? '0').replace(/\D/g, ''), 10) || 0;

		return {
			upvotes: upvotes,
			downvotes: downvotes,
			end: end,
			text: text
		};
	}

	private processVoteFromContainer(messageId: string, userId: string, voteType: VoteType, currentContent: any) {
		const votes = this.voteData.get(messageId) || new Map<string, VoteType>();
		const prevVote = votes.get(userId);

		let upvotes = currentContent.upvotes;
		let downvotes = currentContent.downvotes;
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

		await interaction.reply({ content, flags: MessageFlags.Ephemeral }); 
	}

	private async updateContainer(message: any, currentContent: any, upvotes: number, downvotes: number) {
		// Create Button
		const upvoteButton = new ButtonBuilder().setCustomId('idea_upvote').setLabel(`👍 • ${upvotes}`).setStyle(ButtonStyle.Success);
		const downvoteButton = new ButtonBuilder().setCustomId('idea_downvote').setLabel(`👎 • ${downvotes}`).setStyle(ButtonStyle.Danger);

		const newContainer = new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(currentContent.text)
				)
				.addActionRowComponents(
					new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton)
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(currentContent.end)
				);



		try {
			await message.edit({
			components : [newContainer],
			flags: MessageFlags.IsComponentsV2
		});
		} catch (error) {
			console.error('Failed to update container:', error);
		}
	}
}
