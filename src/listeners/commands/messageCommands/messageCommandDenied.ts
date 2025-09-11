import type { Events, MessageCommandDeniedPayload } from '@sapphire/framework';
import { Listener, type UserError } from '@sapphire/framework';
import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MessageCommandDenied> {
	public override async run({ context, message: content }: UserError, { message }: MessageCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		const component = [
				new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${content}`))
			];

		return message.reply({ components: component, allowedMentions: { users: [message.author.id], roles: [] } });
	}
}
