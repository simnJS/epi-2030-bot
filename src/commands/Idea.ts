// To implent : DB to save ideas or simply a json or discord channel to log them

import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder } from 'discord.js';

const activeIdeas = new Map<string, number>(); // userId -> endTime

@ApplyOptions<Command.Options>({
	name: 'idea',
	description: 'Suggest an idea for the bot and let the community vote on it',
	preconditions: ['IdeaChannelOnly']
})
export class IdeaCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			new SlashCommandBuilder()
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('description').setDescription('Describe your idea').setRequired(true))
				.addIntegerOption((option) => option.setName('duration').setDescription('Voting duration in minutes').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const idea = interaction.options.getString('description', true);
		const duration = interaction.options.getInteger('duration') || 1440;

		if (duration <= 0) {
			await interaction.reply({
				content: 'Duration must be a positive integer',
				ephemeral: true
			});
			return;
		}

		const voteDurationMs = duration * 60 * 1000;
		const endTime = Date.now() + voteDurationMs;

		const userId = interaction.user.id;
		const now = Date.now();

		// Verify if user already has an active idea
		if (activeIdeas.has(userId) && activeIdeas.get(userId)! > now) {
			await interaction.reply({
				content: 'You already have an active idea being voted on. Please wait until the current vote ends before submitting a new idea',
				ephemeral: true
			});
			return;
		}

		// Save the idea as active
		activeIdeas.set(userId, now + voteDurationMs);

		const baseEmbed = new EmbedBuilder()
			.setTitle('💡 Idea suggestion for the Discord bot')
			.setDescription(idea)
			.setColor(0x5865f2)
			.setFooter({ text: `Suggested by ${interaction.user.tag}` })
			.setTimestamp();

		const createEmbed = () =>
			EmbedBuilder.from(baseEmbed).setFields([
				{ name: '👍 For', value: '0', inline: true },
				{ name: '👎 Against', value: '0', inline: true },
				{ name: '⏳ Time left', value: formatDuration(Math.max(endTime - Date.now(), 0)), inline: true }
			]);

		const upvoteButton = new ButtonBuilder().setCustomId('idea_upvote').setLabel('👍').setStyle(ButtonStyle.Success);

		const downvoteButton = new ButtonBuilder().setCustomId('idea_downvote').setLabel('👎').setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton);

		await interaction.reply({
			embeds: [createEmbed()],
			components: [row]
		});

		const message = await interaction.fetchReply();

		// Update of time left
		const interval = setInterval(async () => {
			const remaining = Math.max(endTime - Date.now(), 0);
			try {
				await message.edit({
					embeds: [createEmbed()]
				});
			} catch {}
			if (remaining <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		// End vote after duration
		setTimeout(async () => {
			clearInterval(interval);

			const currentEmbed = message.embeds[0];
			const upvotes = parseInt(currentEmbed.fields?.[0]?.value || '0');
			const downvotes = parseInt(currentEmbed.fields?.[1]?.value || '0');

			const finalEmbed = EmbedBuilder.from(baseEmbed)
				.setTitle('💡 Idea proposal for the Discord bot')
				.setFields([
					{ name: '👍 For', value: upvotes.toString(), inline: true },
					{ name: '👎 Against', value: downvotes.toString(), inline: true },
					{ name: '⏳ Vote ended', value: formatDuration(0), inline: true }
				])
				.setFooter({ text: 'Vote ended' });

			try {
				await message.edit({
					components: [],
					embeds: [finalEmbed]
				});
			} catch {}

			try {
				await message.delete(); // Delete the message to avoid confusion
			} catch {}

			const resultMsg =
				upvotes > downvotes
					? '`Members of the promo said yes, you can add the feature(s) to the bot !`'
					: "`Members of the promo said no, your idea won't be added to the bot`";

			const resultEmbed = new EmbedBuilder()
				.setTitle('📊 Result of vote')
				.setDescription(`The vote for the idea: "**${idea}**" has finished!`)
				.addFields(
					{ name: '👍 For', value: upvotes.toString(), inline: true },
					{ name: '👎 Against', value: downvotes.toString(), inline: true },
					{ name: 'Decision', value: resultMsg }
				)
				.setColor(upvotes > downvotes ? 0x43b581 : 0xf04747)
				.setTimestamp();

			await interaction.followUp({
				embeds: [resultEmbed],
				ephemeral: false
			});

			activeIdeas.delete(userId);
		}, voteDurationMs);
	}
}

function formatDuration(ms: number): string {
	const sec = Math.floor(ms / 1000) % 60;
	const min = Math.floor(ms / (1000 * 60)) % 60;
	const hr = Math.floor(ms / (1000 * 60 * 60));
	let parts = [];
	if (hr) parts.push(`${hr}h`);
	if (min) parts.push(`${min}m`);
	if (sec) parts.push(`${sec}s`);
	return parts.join(' ') || '0s';
}
