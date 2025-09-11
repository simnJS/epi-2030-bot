import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ContainerBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, type ButtonInteraction, MessageFlags } from 'discord.js';

type VoteType = 'up' | 'down';

export class IdeaButtonHandler extends InteractionHandler {
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

		const voteType = this.getVoteType(customId);
		if (!voteType) return;

		const idea = await this.container.prisma.idea.findUnique({
			where: { messageId: message.id },
			include: { votes: true }
		});

		if (!idea) {
			await this.replyToUser(interaction, voteType, false, 'Idea not found');
			return;
		}

		if (!idea.isActive || new Date() > idea.endTime) {
			await this.replyToUser(interaction, voteType, false, 'Voting has ended for this idea');
			return;
		}

		const { upvotes, downvotes, changed } = await this.processVote(idea.id, user.id, voteType);

		await this.replyToUser(interaction, voteType, changed);

		if (changed) {
			await this.updateContainer(message, idea, upvotes, downvotes);
		}
	}

	private getVoteType(customId: string): VoteType | null {
		if (customId === 'idea_upvote') return 'up';
		if (customId === 'idea_downvote') return 'down';
		return null;
	}

	private async processVote(ideaId: string, userId: string, voteType: VoteType) {
		const prismaVoteType = voteType === 'up' ? 'UP' : 'DOWN';

		const existingVote = await this.container.prisma.vote.findUnique({
			where: {
				ideaId_userId: {
					ideaId: ideaId,
					userId: userId
				}
			}
		});

		let changed = false;

		if (existingVote) {
			if (existingVote.type !== prismaVoteType) {
				await this.container.prisma.vote.update({
					where: { id: existingVote.id },
					data: { type: prismaVoteType }
				});
				changed = true;
			}
		} else {
			await this.container.prisma.vote.create({
				data: {
					ideaId: ideaId,
					userId: userId,
					type: prismaVoteType
				}
			});
			changed = true;
		}

		const upvotes = await this.container.prisma.vote.count({
			where: { ideaId: ideaId, type: 'UP' }
		});
		const downvotes = await this.container.prisma.vote.count({
			where: { ideaId: ideaId, type: 'DOWN' }
		});

		return { upvotes, downvotes, changed };
	}

	private async replyToUser(interaction: ButtonInteraction, voteType: VoteType, changed: boolean, errorMsg?: string) {
		let content: string;

		if (errorMsg) {
			content = errorMsg;
		} else {
			const voteLabel = voteType === 'up' ? '👍 • For' : '👎 • Against';
			content = changed
				? `Your vote "${voteLabel}" has been recorded!`
				: 'You already voted this. You can change your vote by clicking the other button';
		}

		const component = [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${content}`))];

		await interaction.reply({
			components: component,
			flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
		});
	}

	private async updateContainer(message: any, idea: any, upvotes: number, downvotes: number) {
		const upvoteButton = new ButtonBuilder().setCustomId('idea_upvote').setLabel(`👍 • ${upvotes}`).setStyle(ButtonStyle.Success);
		const downvoteButton = new ButtonBuilder().setCustomId('idea_downvote').setLabel(`👎 • ${downvotes}`).setStyle(ButtonStyle.Danger);

		const newContainer = new ContainerBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`## 💡 ${idea.title}\n\n### ${idea.description}\n*Suggested by ${idea.authorName}*`)
			)
			.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# *Ends <t:${Math.floor(idea.endTime.getTime() / 1000)}:R>*`));

		try {
			await message.edit({
				components: [newContainer],
				flags: MessageFlags.IsComponentsV2
			});
		} catch (error) {
			console.error('Failed to update container:', error);
		}
	}
}
