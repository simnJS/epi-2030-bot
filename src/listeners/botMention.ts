import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message, TextChannel, GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class BotMentionListener extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		// Ignore bot messages
		if (message.author.bot) return;

		// Check if the bot is mentioned in the message
		if (!message.mentions.has(this.container.client.user!)) return;

		// Do nothing if we cannot send messages in the channel
		if (!message.channel.isSendable()) return;

		try {
			const channel = message.channel as TextChannel;
			const messages = await channel.messages.fetch({ limit: 15 });
			const messageArray = Array.from(messages.values()).reverse().slice(0, -1);

			const contextTextParts: string[] = [];

			for (const msg of messageArray) {
				if (!msg.content.length) continue;

				let replyInfo = "";
				if (msg.reference?.messageId) {
					try {
						const repliedMessage = await channel.messages.fetch(msg.reference.messageId);
						if (repliedMessage) {
							const author = (await channel.guild?.members.fetch(repliedMessage.author.id)) as GuildMember
							replyInfo = ` (in reply to [${author.displayName}]: ${repliedMessage.cleanContent.slice(0, 50)}${repliedMessage.content.length > 50 ? "..." : ""})`;
						}
					} catch {
						replyInfo = " (reply to an inaccessible message)";
					}
				}
				const author = (await channel.guild?.members.fetch(msg.author.id)) as GuildMember
				contextTextParts.push(`[${author.displayName}]: ${msg.cleanContent}${replyInfo}`);
			}

			const contextText = contextTextParts.join('\n');
			let replyInfo = "";
				if (message.reference?.messageId) {
					try {
						const repliedMessage = await channel.messages.fetch(message.reference.messageId);
						if (repliedMessage) {
							const author = (await channel.guild?.members.fetch(repliedMessage.author.id)) as GuildMember
							replyInfo = ` (in reply to [${author.displayName}]: ${repliedMessage.cleanContent.slice(0, 50)}${repliedMessage.content.length > 50 ? "..." : ""})`;
						}
					} catch {
						replyInfo = " (reply to an inaccessible message)";
					}
				}

			const usermember = (await channel.guild?.members.fetch(message.author.id)) as GuildMember
			const userMessage = {author: usermember.displayName, message:message.cleanContent+ replyInfo};

			console.log('Context text:', contextText);
			console.log(`${userMessage.author} request's : ${userMessage.message}`);

			const completion = await this.container.groq.chat.completions.create({
				model: 'openai/gpt-oss-20b',
				messages: [
					{
						role: 'system',
						content: `You are a chatbot called Epitech 2030 Bot that communicates naturally, like a real human. You receive three pieces of information:
User message – the core instruction or question the user wants you to answer.
Message history – the last 15 messages from the conversation, which may contain context.
Your task:
Respond in the language the user is speaking (usually French, but sometimes English).
Use the message history to understand context and maintain continuity.
If the user’s current request is unrelated to the previous messages, focus only on the user’s request.
Give the most natural, human-like response possible, making it sound like a real person is replying.
Never mention being an AI, a bot, or refer to instructions or prompts.
Keep your tone friendly, clear, and coherent.
Never send message that as more than 2000 character with space only 200 tokens max, try to be short`
					},
					{
						role: 'user',
						content: `${userMessage.message} request's : "${userMessage.message} \nThe last messages send in channel :${contextText}`
					}
				],
				max_tokens: 50000
			});

			const response = completion.choices[0]?.message?.content || "AI not responding";
			const reponseWithoutEveryone = response.replace(/@(everyone|here)/g, "@j'aipasledroit").trim()

			if (reponseWithoutEveryone && reponseWithoutEveryone.trim().length > 0) {
				for (let i = 0; i < reponseWithoutEveryone.length; i += 2000) {
					await message.channel.send({ 
						content: reponseWithoutEveryone.slice(i, i + 2000), 
						reply: i === 0 ? { messageReference: message.id } : undefined 
					});
				}
			}
		} catch (error) {
			this.container.logger.error('Error inc mention response:', error);
		}
		return;
	}
}
