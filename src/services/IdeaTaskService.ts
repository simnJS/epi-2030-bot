import { container } from '@sapphire/framework';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, type Message } from 'discord.js';

export class IdeaTaskService {
	private intervalId: NodeJS.Timeout | null = null;

	public async start() {
		try {
			await this.checkExpiredIdeas();
		} catch (error) {
			container.logger.error('Failed initial expired ideas check:', error);
		}

		this.intervalId = setInterval(async () => {
			await this.checkExpiredIdeas();
		}, 60 * 1000);

		container.logger.info('IdeaTaskService started');
	}

	public stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			container.logger.info('IdeaTaskService stopped');
		}
	}

	private async checkExpiredIdeas() {
		try {
			const now = new Date();

			const expiredIdeas = await container.prisma.idea.findMany({
				where: {
					isActive: true,
					endTime: {
						lt: now
					}
				},
				include: {
					votes: true
				}
			});

			for (const idea of expiredIdeas) {
				await this.finalizeIdea(idea);
			}
		} catch (error) {
			container.logger.error('Error checking expired ideas:', error);
		}
	}

	private async finalizeIdea(idea: any) {
		try {
			const upvotes = idea.votes.filter((vote: any) => vote.type === 'UP').length;
			const downvotes = idea.votes.filter((vote: any) => vote.type === 'DOWN').length;

			await container.prisma.idea.update({
				where: { id: idea.id },
				data: {
					isActive: false,
					upvotes: upvotes,
					downvotes: downvotes
				}
			});

			const client = container.client;

			let message: Message | undefined;
			let channel: any;

			try {
				const guild = await client.guilds.fetch('1391769906944409662');
				const channels = await guild.channels.fetch();

				for (const [, ch] of channels) {
					if (ch?.isTextBased()) {
						try {
							message = await ch.messages.fetch(idea.messageId);
							channel = ch;
							break;
						} catch {}
					}
				}

				if (!message || !channel) {
					container.logger.warn(`Could not find message ${idea.messageId} for idea ${idea.id}`);
					return;
				}
			} catch (error) {
				container.logger.error(`Error fetching message ${idea.messageId}:`, error);
				return;
			}

			const upvoteButtonFinal = new ButtonBuilder()
				.setCustomId('idea_upvote')
				.setLabel(`👍 • ${upvotes}`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);

			const downvoteButtonFinal = new ButtonBuilder()
				.setCustomId('idea_downvote')
				.setLabel(`👎 • ${downvotes}`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);

			const resultMsg =
				upvotes <= downvotes
					? "Members of the promo said no, your idea won't be added to the bot"
					: 'Members of the promo said yes, you can add the feature to the bot !';

			const finalComponents = [
				new ContainerBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`## 💡 ${idea.title}\n\n### ${idea.description}\n*Suggested by ${idea.authorName}*`)
					)
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButtonFinal, downvoteButtonFinal))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`### ${resultMsg}\n-# *Vote ended <t:${Math.floor(idea.endTime.getTime() / 1000)}:R>*`)
					)
			];

			await message.edit({
				components: finalComponents,
				flags: MessageFlags.IsComponentsV2
			});

			container.logger.info(`Finalized idea ${idea.id}: ${upvotes} upvotes, ${downvotes} downvotes`);
		} catch (error) {
			container.logger.error(`Error finalizing idea ${idea.id}:`, error);
		}
	}
}
