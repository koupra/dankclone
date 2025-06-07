import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { WeeklyRewardService } from '../../services/WeeklyRewardService';

export const command: SlashCommand = {
  name: 'weekly',
  description: 'Claim your weekly rewards',
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    try {
      const userId = interaction.user.id;
      const result = await WeeklyRewardService.claimWeeklyReward(userId);
      const nextWeekly = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const unixTimestamp = Math.floor(nextWeekly.getTime() / 1000);
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Weekly Coins`)
        .setColor('#2b2d31')
        .setDescription(`> 🪙 ${result.total.toLocaleString()} was placed in your wallet!`)
        .addFields([
          {
            name: 'Next Weekly',
            value: `<t:${unixTimestamp}:R>`,
            inline: true
          }
        ]);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('You can claim your next weekly reward in')) {
          const timeMatch = errorMessage.match(/(\d+)d (\d+)h/);
          let timeRemaining = 'in 7 days';
          if (timeMatch && timeMatch.length >= 3) {
            const days = parseInt(timeMatch[1]);
            const hours = parseInt(timeMatch[2]);
            timeRemaining = `in ${days} days`;
            if (days === 0) {
              timeRemaining = `in ${hours} hours`;
            }
          }
          const errorEmbed = new EmbedBuilder().setDescription(`You already got your weekly! Try again ${timeRemaining}`);
          await interaction.editReply({ content: '', embeds: [errorEmbed] });
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