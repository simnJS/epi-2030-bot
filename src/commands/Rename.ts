import config from "../config";

import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { MessageFlags, GuildMember, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'rename',
	description: 'Command to rename a user'
})
export class RenameCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addUserOption((option) => option.setName('target').setDescription('The user to rename').setRequired(true))
					.addStringOption((option) => option.setName('newname').setDescription('The new name for the user').setRequired(true)),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const initialmember = interaction.member as GuildMember;
		const initialusername = initialmember.nickname
		if (!initialmember.permissions.has(PermissionFlagsBits.Administrator) && !config.admins.includes(interaction.user.id)) {
			const component = [
				new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### Permission denied`)
				)
			]
			await interaction.reply({
				components : component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		const targetUser = interaction.options.getUser('target', true);
		const newName = interaction.options.getString('newname', true);

		const member = await interaction.guild?.members.fetch(targetUser.id);
		if (!member) {
			const component = [
				new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### User not found in this guild`)
				)
			]
			await interaction.reply({
				components : component,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
			});
			return;
		}

		try {
            await member.setNickname(newName);
        } catch {
            const component = [
                new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### Failed to rename\n*Maybe the bot does not have permission to change this user's nickname*`)
                )
            ]
            await interaction.reply({
                components : component,
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });
            return;
        }
		const component = [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### User renamed\nSuccessfully renamed ${initialusername} to ${newName}`)
                )
        ]
        await interaction.reply({
                components : component,
                flags: [MessageFlags.IsComponentsV2]
        });
	}
}
