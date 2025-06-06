import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { DailyRewardService } from '../../services/DailyRewardService';

export const command: SlashCommand = {
  name: 'daily',
  description: 'Claim your daily rewards',
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer reply
    await interaction.deferReply();
    
    try {
      // Get user ID
      const userId = interaction.user.id;
      
      // Claim daily reward
      const result = await DailyRewardService.claimDailyReward(userId);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Daily Rewards')
        .setDescription(`You received **⏣ ${result.amount.toLocaleString()}** as your daily reward.`)
        .addFields(
          { name: 'Streak', value: `${result.streak} days (+⏣ ${result.streakBonus.toLocaleString()})`, inline: true },
          { name: 'Total', value: `⏣ ${result.total.toLocaleString()}`, inline: true }
        )
        .setFooter({ text: `Come back tomorrow to claim your next daily reward!` })
        .setTimestamp();
      
      // Send the embed
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      // Handle errors (like already claimed today)
      if (error instanceof Error) {
        await interaction.editReply({
          content: `❌ ${error.message}`
        });
      } else {
        await interaction.editReply({
          content: '❌ An error occurred while claiming your daily reward.'
        });
      }
    }
  }
}; 