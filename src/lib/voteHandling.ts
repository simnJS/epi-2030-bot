import { ButtonInteraction, Message } from 'discord.js';

export function handleVote(
    i: ButtonInteraction,
    votes: Map<string, 'up' | 'down'>,
    upvotes: number,
    downvotes: number
): { upvotes: number; downvotes: number; changed: boolean } {
    const prevVote = votes.get(i.user.id);
    let changed = false;

    if (i.customId === 'idea_upvote') {
        if (prevVote !== 'up') {
            if (prevVote === 'down') downvotes--;
            upvotes++;
            votes.set(i.user.id, 'up');
            changed = true;
        }
    } else if (i.customId === 'idea_downvote') {
        if (prevVote !== 'down') {
            if (prevVote === 'up') upvotes--;
            downvotes++;
            votes.set(i.user.id, 'down');
            changed = true;
        }
    }
    return { upvotes, downvotes, changed };
}

export function createVoteCollector(message: Message, time: number) {
    return message.createMessageComponentCollector({
        filter: (i) => i.isButton(),
        time
    });
}