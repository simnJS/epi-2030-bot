import { Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, SlashCommandBuilder } from 'discord.js';
import { handleVote, createVoteCollector } from '../lib/voteHandling';
import { saveIdeaVote, removeIdeaVote, getActiveIdeaEndTime } from '../lib/dbPersistence';
import { buildIdeaEmbed, buildResultEmbed } from '../lib/embedFormatting';

// Only allow voting in this channel
const IDEA_CHANNEL_ID = '1412031515533250611';

export class IdeaCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'idea',
            description: 'Propose a new feature for the bot'
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            new SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Describe your idea')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Voting duration in minutes (default: 1440)')
                        .setRequired(true)
                )
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const idea = interaction.options.getString('description', true);
        const duration = interaction.options.getInteger('duration') ?? 1440;

        if (interaction.channelId !== IDEA_CHANNEL_ID) {
            await interaction.reply({
                content: "This command can only be used in the ideas channel: <#1412031515533250611>.",
                ephemeral: true
            });
            return;
        }

        if (duration <= 0) {
            await interaction.reply({
                content: "Voting duration must be greater than 0 minutes.",
                ephemeral: true
            });
            return;
        }

        const voteDurationMs = duration * 60 * 1000;
        const endTime = Date.now() + voteDurationMs;
        const userId = interaction.user.id;
        const now = Date.now();

        // DB persistence: check if user already has an active idea
        const activeEndTime = await getActiveIdeaEndTime(userId);
        if (activeEndTime && activeEndTime > now) {
            await interaction.reply({
                content: "You already have an idea being voted on. Please wait until voting ends before proposing another.",
                ephemeral: true
            });
            return;
        }

        // Save the new idea to DB
        await saveIdeaVote(userId, idea, endTime);

        // Voting state
        let upvotes = 0;
        let downvotes = 0;
        const votes = new Map<string, 'up' | 'down'>();

        // Embed and buttons
        const upvoteButton = new ButtonBuilder()
            .setCustomId('idea_upvote')
            .setLabel('👍')
            .setStyle(ButtonStyle.Success);

        const downvoteButton = new ButtonBuilder()
            .setCustomId('idea_downvote')
            .setLabel('👎')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton);

        const message = await interaction.reply({
            embeds: [buildIdeaEmbed({
                idea,
                upvotes,
                downvotes,
                remaining: voteDurationMs,
                author: interaction.user.tag
            })],
            components: [row],
            fetchReply: true
        });

        // Collector logic
        const collector = createVoteCollector(message, voteDurationMs);

        collector.on('collect', async (i: ButtonInteraction) => {
            const result = handleVote(i, votes, upvotes, downvotes);
            upvotes = result.upvotes;
            downvotes = result.downvotes;

            await i.reply({
                content: result.changed
                    ? `Your vote "${i.customId === 'idea_upvote' ? '👍 Yes' : '👎 No'}" has been counted!`
                    : 'You already voted this way. You can change your vote by clicking the other button.',
                ephemeral: true
            });

            try {
                await message.edit({
                    embeds: [buildIdeaEmbed({
                        idea,
                        upvotes,
                        downvotes,
                        remaining: Math.max(endTime - Date.now(), 0),
                        author: interaction.user.tag
                    })]
                });
            } catch { }
        });

        // Interactive time left update
        let interval: NodeJS.Timeout | null = null;
        interval = setInterval(async () => {
            const remaining = Math.max(endTime - Date.now(), 0);
            try {
                await message.edit({
                    embeds: [buildIdeaEmbed({
                        idea,
                        upvotes,
                        downvotes,
                        remaining,
                        author: interaction.user.tag
                    })]
                });
            } catch { }
            if (remaining <= 0 && interval) {
                clearInterval(interval);
            }
        }, 1000);

        collector.on('end', async () => {
            if (interval) clearInterval(interval);

            try {
                await message.delete();
            } catch { }

            const approved = upvotes > downvotes;
            const resultEmbed = buildResultEmbed({
                idea,
                upvotes,
                downvotes,
                approved
            });

            await interaction.followUp({
                embeds: [resultEmbed],
                ephemeral: false
            });

            // Remove idea from DB
            await removeIdeaVote(userId);
        });
    }
}
