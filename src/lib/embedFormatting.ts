import { EmbedBuilder } from 'discord.js';

export function buildIdeaEmbed(params: {
    idea: string;
    upvotes: number;
    downvotes: number;
    remaining: number;
    author: string;
    ended?: boolean;
}): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('💡 Bot Feature Proposal')
        .setDescription(params.idea)
        .addFields(
            { name: '👍 Yes', value: params.upvotes.toString(), inline: true },
            { name: '👎 No', value: params.downvotes.toString(), inline: true },
            {
                name: params.ended ? '⏳ Voting ended' : '⏳ Time left',
                value: formatDuration(params.remaining),
                inline: true
            }
        )
        .setColor(params.ended ? 0x5865f2 : 0x5865f2)
        .setFooter({ text: params.ended ? 'Voting ended' : `Proposed by ${params.author}` })
        .setTimestamp();
}

export function buildResultEmbed(params: {
    idea: string;
    upvotes: number;
    downvotes: number;
    approved: boolean;
}): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('📊 Voting Result')
        .setDescription(`Voting for the idea "**${params.idea}**" has ended!`)
        .addFields(
            { name: '👍 Yes', value: params.upvotes.toString(), inline: true },
            { name: '👎 No', value: params.downvotes.toString(), inline: true },
            {
                name: 'Decision',
                value: params.approved
                    ? 'The people have spoken: you may add this feature to the bot.'
                    : 'The people have spoken: you may NOT add this feature to the bot.'
            }
        )
        .setColor(params.approved ? 0x43b581 : 0xf04747)
        .setTimestamp();
}

function formatDuration(ms: number): string {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / (1000 * 60)) % 60;
    const hr = Math.floor(ms / (1000 * 60 * 60));
    const parts = [];
    if (hr) parts.push(`${hr}h`);
    if (min) parts.push(`${min}m`);
    if (sec) parts.push(`${sec}s`);
    return parts.join(' ') || '0s';
}