import { ApplyOptions } from "@sapphire/decorators";
import { Awaitable, Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags, GuildMember, PermissionFlagsBits  } from "discord.js";

@ApplyOptions<Command.Options>({
    description: "Command to add name to pseudo"
})
export class PingCommand extends Command {
    public override registerApplicationCommands(registry : Command.Registry): Awaitable<void> {

        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName("add-name")
                    .setDescription(this.description)
                    .addUserOption(option => 
                        option.setName('target')
                            .setDescription('The user that you want to add name')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('Name of user')
                            .setRequired(true)
                        ),
                { guildIds: ["1391769906944409662"]}
        )   
    }

    public override async chatInputRun(interaction : Command.ChatInputCommandInteraction) {

        const initialmember = interaction.member as GuildMember;

        if (!initialmember.permissions.has(PermissionFlagsBits.Administrator)) {
            const embedfail = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("Permission denied")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
            return interaction.reply({embeds: [embedfail], flags : MessageFlags.Ephemeral});
        }

        const targetUser = interaction.options.getUser('target', true);
        const name = interaction.options.getString('name', true);

        const member = await interaction.guild?.members.fetch(targetUser.id);
        if (!member) {
            const embedfail = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("User not found in this guild")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
            return interaction.reply({embeds: [embedfail], flags : MessageFlags.Ephemeral});
        }

        await member.setNickname(`${targetUser.globalName} (${name})`).catch(
            () => {
                const embedfail = new EmbedBuilder()
                    .setColor("DarkRed")
                    .setTitle("Failed to add name")
                    .setDescription("Maybe the bot does not have permission to change this user's nickname")
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
                interaction.reply({embeds: [embedfail], flags : MessageFlags.Ephemeral});
            }
        );

        const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("User renamed")
                .setDescription(`Successfully add name ${name} to ${targetUser.tag}`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
        return interaction.reply({embeds: [embed]});
    }
}