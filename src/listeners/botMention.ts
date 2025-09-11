import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message, TextChannel } from 'discord.js';

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

		console.log('Bot mention detected in message:', message.content);

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
							replyInfo = ` (in reply to [${repliedMessage.author.displayName || repliedMessage.author.username}]: ${repliedMessage.content.slice(0, 50)}${repliedMessage.content.length > 50 ? "..." : ""})`;
						}
					} catch {
						replyInfo = " (reply to an inaccessible message)";
					}
				}

				contextTextParts.push(`[${msg.author.displayName || msg.author.username}]: ${msg.content}${replyInfo}`);
			}

			const contextText = contextTextParts.join('\n');


			const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();

			console.log('Context text:', contextText);
			console.log('User message:', userMessage);

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
						content: `The user says: "${userMessage}. Context of the last channel messages:${contextText}`
					}
				],
				max_tokens: 50000
			});

			const response = completion.choices[0]?.message?.content;

			if (response && response.trim().length > 0) {
				for (let i = 0; i < response.length; i += 2000) {
					await message.channel.send({ 
						content: response.slice(i, i + 2000), 
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
