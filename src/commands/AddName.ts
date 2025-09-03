import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { MessageFlags, GuildMember, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder } from 'discord.js';

const admin = process.env.TEMP_ADMIN

@ApplyOptions<Command.Options>({
	description: 'Command to add name to pseudo'
})
export class AddNameCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName('add-name')
					.setDescription(this.description)
					.addUserOption((option) => option.setName('target').setDescription('The user that you want to add name').setRequired(true))
					.addStringOption((option) => option.setName('name').setDescription('Name of user').setRequired(true)),
			{ guildIds: ['1391769906944409662'] }
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const initialmember = interaction.member as GuildMember;
		const initialusername = initialmember.nickname

		if (!initialmember.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== admin) {
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
		const name = interaction.options.getString('name', true);

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
            await member.setNickname(`${initialmember.nickname} (${name})`);
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
                    new TextDisplayBuilder().setContent(`### User renamed\nSuccessfully add name ${name} to ${initialusername}`)
                )
        ]
        await interaction.reply({
                components : component,
                flags: [MessageFlags.IsComponentsV2]
        });
	}
}
