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
        const errorMessage = error.message;
        
        // Check if it's the "already claimed" error
        if (errorMessage.includes("You can claim your next daily reward in")) {
          // Extract hours and minutes from error message
          const timeMatch = errorMessage.match(/(\d+)h (\d+)m/);
          let timeRemaining = "in 24 hours";
          
          if (timeMatch && timeMatch.length >= 3) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            timeRemaining = `in ${hours} hours`;
            
            if (hours === 0) {
              timeRemaining = `in ${minutes} minutes`;
            }
          }
          
          // Create the error embed that matches the image
          await interaction.editReply({
            content: `You already got your daily today! Try again ${timeRemaining}`
          });
        } else {
          await interaction.editReply({
            content: `❌ ${errorMessage}`
          });
        }
      } else {
        await interaction.editReply({
          content: '❌ An error occurred while claiming your daily reward.'
        });
      }
    }
  }
}; 