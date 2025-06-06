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
        .setTitle(`${interaction.user.username}'s Daily Coins`)
        .setDescription(`⏣ ${result.total.toLocaleString()} was placed in your wallet!`)
        .addFields(
          { 
            name: 'Base', 
            value: `⏣ ${result.amount.toLocaleString()}`,
            inline: true 
          },
          { 
            name: 'Streak Bonus', 
            value: `⏣ ${result.streakBonus.toLocaleString()}`,
            inline: true 
          },
          {
            name: 'Next Daily',
            value: 'in 24 hours',
            inline: true
          },
          {
            name: 'Streak',
            value: `${result.streak}`,
            inline: true
          }
        );
      
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