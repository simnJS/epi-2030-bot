//J'aimerais bien le save en db avec Prisma pour avoir des logs et faire en sort que si le bot crash les idées en cours de votes ne soient pas perdues

import { Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, SlashCommandBuilder } from 'discord.js';

const activeIdeas = new Map<string, number>(); // userId -> endTime

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hr = Math.floor(ms / (1000 * 60 * 60));
  let parts = [];
  if (hr) parts.push(`${hr}h`);
  if (min) parts.push(`${min}m`);
  if (sec) parts.push(`${sec}s`);
  return parts.join(' ') || '0s';
}

export class IdeeiCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'idee',
      description: 'Proposez une idée à ajouteter au bot'
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Décrivez votre idée')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('duree')
            .setDescription('Durée du vote en minutes')
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const idee = interaction.options.getString('description', true);
    const duree = interaction.options.getInteger('duree') ?? 1440;

    if (interaction.channelId !== '1411791633296396328') {
      await interaction.reply({
        content: "Cette commande ne peut être utilisée que dans le salon dédié aux idées. <#1411791633296396328>",
        ephemeral: true
      });
      return;
    }

    if (duree <= 0) {
      await interaction.reply({
        content: "La durée du vote doit être supérieure à 0 minute.",
        ephemeral: true
      });
      return;
    }

    const voteDurationMs = duree * 60 * 1000;
    const endTime = Date.now() + voteDurationMs;

    const userId = interaction.user.id;
    const now = Date.now();

    // Vérifie si l'utilisateur a déjà une idée en cours
    if (activeIdeas.has(userId) && activeIdeas.get(userId)! > now) {
      await interaction.reply({
        content: "Vous avez déjà une idée en cours de vote. Veuillez attendre la fin du vote avant d'en proposer une nouvelle.",
        ephemeral: true
      });
      return;
    }

    // Enregistre l'idée comme active
    activeIdeas.set(userId, now + voteDurationMs);

    let upvotes = 0;
    let downvotes = 0;
    const votes = new Map<string, 'up' | 'down'>();

    const embed = () => new EmbedBuilder()
      .setTitle('💡 Proposition d\'idée pour le bot Discord')
      .setDescription(idee)
      .addFields(
        { name: '👍 Pour', value: upvotes.toString(), inline: true },
        { name: '👎 Contre', value: downvotes.toString(), inline: true },
        { name: '⏳ Durée restante', value: formatDuration(Math.max(endTime - Date.now(), 0)), inline: true }
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Proposé par ${interaction.user.tag}` })
      .setTimestamp();

    const upvoteButton = new ButtonBuilder()
      .setCustomId('idee_upvote')
      .setLabel('👍')
      .setStyle(ButtonStyle.Success);

    const downvoteButton = new ButtonBuilder()
      .setCustomId('idee_downvote')
      .setLabel('👎')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(upvoteButton, downvoteButton);

    const message = await interaction.reply({
      embeds: [embed()],
      components: [row],
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.isButton(),
      time: voteDurationMs
    });

    collector.on('collect', async (i: ButtonInteraction) => {
      const prevVote = votes.get(i.user.id);
      let changed = false;

      if (i.customId === 'idee_upvote') {
        if (prevVote !== 'up') {
          if (prevVote === 'down') downvotes--;
          upvotes++;
          votes.set(i.user.id, 'up');
          changed = true;
        }
      } else if (i.customId === 'idee_downvote') {
        if (prevVote !== 'down') {
          if (prevVote === 'up') upvotes--;
          downvotes++;
          votes.set(i.user.id, 'down');
          changed = true;
        }
      }

      await i.reply({
        content: changed
          ? `Votre vote "${i.customId === 'idee_upvote' ? '👍 Pour' : '👎 Contre'}" a été pris en compte !`
          : 'Vous avez déjà voté ainsi. Vous pouvez changer votre vote en cliquant sur l\'autre bouton.',
        ephemeral: true
      });

      try {
        await message.edit({
          embeds: [embed()]
        });
      } catch {}
    });

    // Mise à jour interactive de la durée restante
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(async () => {
      const remaining = Math.max(endTime - Date.now(), 0);
      try {
        await message.edit({
          embeds: [embed()]
        });
      } catch {}
      if (remaining <= 0 && interval) {
        clearInterval(interval);
      }
    }, 1000);

    collector.on('end', async () => {
      if (interval) clearInterval(interval);
      const finalEmbed = new EmbedBuilder()
        .setTitle('💡 Proposition d\'idée pour le bot Discord')
        .setDescription(idee)
        .addFields(
          { name: '👍 Pour', value: upvotes.toString(), inline: true },
          { name: '👎 Contre', value: downvotes.toString(), inline: true },
          { name: '⏳ Vote terminé', value: formatDuration(0), inline: true }
        )
        .setFooter({ text: 'Vote terminé' })
        .setTimestamp();

      try {
        await message.edit({
          components: [],
          embeds: [finalEmbed]
        });
      } catch {}

      try {
        await message.delete(); // Supprime le message de proposition
      } catch {}

      const resultMsg =
        upvotes > downvotes
          ? "`Le peuple a parlé et vous pouvez donc rajouter la/les feature(s) au bot.`"
          : "`Le peuple a parlé et vous ne pouvez pas rajouter la/les feature(s) au bot, désolé.`";

      const resultEmbed = new EmbedBuilder()
        .setTitle('📊 Résultat du vote')
        .setDescription(`Le vote pour l'idée "**${idee}**" est terminé !`)
        .addFields(
          { name: '👍 Pour', value: upvotes.toString(), inline: true },
          { name: '👎 Contre', value: downvotes.toString(), inline: true },
          { name: 'Décision', value: resultMsg }
        )
        .setColor(upvotes > downvotes ? 0x43b581 : 0xf04747)
        .setTimestamp();

      await interaction.followUp({
        embeds: [resultEmbed],
        ephemeral: false
      });

      activeIdeas.delete(userId);
    });
  }
}