import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function saveIdeaVote(userId: string, idea: string, endTime: number) {
    await prisma.ideaVote.create({
        data: { userId, idea, endTime: BigInt(endTime) }
    });
}

export async function removeIdeaVote(userId: string) {
    await prisma.ideaVote.deleteMany({
        where: { userId }
    });
}

export async function getActiveIdeaEndTime(userId: string): Promise<number | undefined> {
    const vote = await prisma.ideaVote.findFirst({
        where: { userId },
        orderBy: { endTime: 'desc' }
    });
    return vote ? Number(vote.endTime) : undefined;
}