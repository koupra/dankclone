import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { WeeklyRewardService } from '../../services/WeeklyRewardService';

function formatWeeklyCooldown(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  if (hours > 0) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  return 'soon';
}

export const command: SlashCommand = {
  name: 'weekly',
  description: 'Claim your weekly rewards',
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    try {
      const userId = interaction.user.id;
      const result = await WeeklyRewardService.claimWeeklyReward(userId);
      // Calculate ms left until next claim
      const msLeft = (result.lastClaimed.getTime() + 7 * 24 * 60 * 60 * 1000) - Date.now();
      const cooldownText = formatWeeklyCooldown(msLeft);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}'s Weekly Coins`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor('#2b2d31')
        .setDescription('Run this command every week to get a moderate sum of coins!')
        .addFields([
          {
            name: 'You received:',
            value: `• 🪙 **${result.total.toLocaleString()}**`,
          },
        ])
        .setFooter({ text: `Claim again ${cooldownText}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('You can claim your next weekly reward in')) {
          // Extract days and hours from error message
          const timeMatch = errorMessage.match(/(\d+)d (\d+)h/);
          let msLeft = 0;
          if (timeMatch && timeMatch.length >= 3) {
            const days = parseInt(timeMatch[1]);
            const hours = parseInt(timeMatch[2]);
            msLeft = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
          }
          const cooldownText = formatWeeklyCooldown(msLeft);
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `${interaction.user.username}'s Weekly Coins`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setColor('#2b2d31')
            .setDescription('Run this command every week to get a moderate sum of coins!')
            .addFields([
              {
                name: 'You received:',
                value: `• 🪙 **2,000,000**`,
              },
            ])
            .setFooter({ text: `Claim again ${cooldownText}` });
          await interaction.editReply({ content: '', embeds: [embed] });
        } else {
          const errorEmbed = new EmbedBuilder().setDescription(`❌ ${errorMessage}`);
          await interaction.editReply({ content: '', embeds: [errorEmbed] });
        }
      } else {
        const errorEmbed = new EmbedBuilder().setDescription('❌ An error occurred while claiming your weekly reward.');
        await interaction.editReply({ content: '', embeds: [errorEmbed] });
      }
    }
  },
}; 