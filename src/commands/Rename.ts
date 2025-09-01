import { ApplyOptions } from "@sapphire/decorators";
import { Awaitable, Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags } from "discord.js";

@ApplyOptions<Command.Options>({
    description: "Command to rename a user"
})
export class PingCommand extends Command {
    public override registerApplicationCommands(registry : Command.Registry): Awaitable<void> {

        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName("rename")
                    .setDescription(this.description)
                    .addUserOption(option => 
                        option.setName('target')
                            .setDescription('The user to rename')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('newname')
                            .setDescription('The new name for the user')
                            .setRequired(true)
                        ),
                { guildIds: ["1391769906944409662"]}
        )   
    }

    public override async chatInputRun(interaction : Command.ChatInputCommandInteraction) {

        if (interaction.user.id !== "594552679397851137") {
            const embedfail = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("Permission denied")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
            return interaction.reply({embeds: [embedfail], flags : MessageFlags.Ephemeral});
        }

        const targetUser = interaction.options.getUser('target', true);
        const newName = interaction.options.getString('newname', true);

        const member = await interaction.guild?.members.fetch(targetUser.id);
        if (!member) {
            const embedfail = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle("User not found in this guild")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
            return interaction.reply({embeds: [embedfail], flags : MessageFlags.Ephemeral});
        }

        await member.setNickname(newName).catch();

        const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("User renamed")
                .setDescription(`Successfully renamed ${targetUser.tag} to ${newName}`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ forceStatic: false })});
        return interaction.reply({embeds: [embed], flags : MessageFlags.Ephemeral});
    }
}