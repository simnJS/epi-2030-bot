import { Precondition } from '@sapphire/framework';
import { CommandInteraction,Interaction,PermissionFlagsBits, GuildMember } from 'discord.js';
import config from '../config';

export class AdminOnlyPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return this.checkIdeaAdmin(interaction as Interaction);
    }

    private async checkIdeaAdmin(interaction: Interaction) {
        const initialmember = interaction.member as GuildMember;
        return initialmember.permissions.has(PermissionFlagsBits.Administrator) || config.admins.includes(interaction.user.id)
            ? this.ok()
            : this.error({ message: 'This command can only be run by admins' });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        AdminOnly: never;
    }
}

export default undefined;
