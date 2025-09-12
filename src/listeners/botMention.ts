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
				contextTextParts.push(
				replyInfo
					? `[${author.displayName}]: ${msg.cleanContent}\n  ↪ ${replyInfo}`
					: `[${author.displayName}]: ${msg.cleanContent}`
				);

			}
			const contextText = contextTextParts.length > 0 
				? contextTextParts.join('\n') 
				: "No previous messages in this conversation.";


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
			const userMessage = {author: usermember.displayName, message:message.cleanContent + replyInfo};

			console.log('Context text:', contextText);
			console.log(`${userMessage.author}'s request : ${userMessage.message}`);

			const completion = await this.container.groq.chat.completions.create({
				model: 'openai/gpt-oss-20b',
				messages: [
					{
						role: 'system',
						content: `You are "Epitech 2030 Bot", a Discord member who chats naturally.
You receive two things:
1. The last 15 messages of the conversation, formatted as [Nickname (Real Name)]: message
2. The user's request, formatted as [Nickname (Real Name)]: message
If people request their real name use the real name receive by message history or user's request if people want their nickname same use just the nickname
Your job:
- Respond in the same language the user speaks (French or English)
- Use the conversation history to keep continuity and context
- If the user’s message is unrelated to previous messages, just answer it naturally
- Sound like a real human talking in the channel
- Be friendly, clear, and coherent`
					},
					{
						role: 'system',
						content: `Conversation history:\n${contextText}`
					},
					{
						role: 'user',
						content: `[${userMessage.author}]: ${userMessage.message}`
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
