import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { MessageFlags, ContainerBuilder, TextDisplayBuilder, GuildMember } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'add-name',
	description: 'Command to add name to pseudo',
	preconditions: ['AdminOnly']
})
export class AddNameCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addUserOption((option) => option.setName('target').setDescription('The user that you want to add name').setRequired(true))
					.addStringOption((option) => option.setName('name').setDescription('Name of user').setRequired(true)),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Test comment for PR workflow

		const targetUser = interaction.options.getUser('target', true);
		const name = interaction.options.getString('name', true);

		const member = await interaction.guild?.members.fetch(targetUser.id) as GuildMember
		if (!member) {
			const component = [
				new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`### User not found in this guild`))
			];
			await interaction.reply({
				components: component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}
		try {
			await member.setNickname(`${member.displayName} (${name})`);
		} catch {
			const component = [
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### Failed to rename\n*Maybe the bot does not have permission to change this user's nickname*`
					)
				)
			];
			await interaction.reply({
				components: component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		const component = [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### User renamed\nSuccessfully add name ${name} to ${member.displayName}`)
			)
		];
		await interaction.reply({
			components: component,
			flags: [MessageFlags.IsComponentsV2]
		});
	}
}
