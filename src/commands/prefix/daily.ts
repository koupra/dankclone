import { Client, Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';
import { DailyRewardService } from '../../services/DailyRewardService';

export const command: PrefixCommand = {
  name: 'daily',
  aliases: ['day'],
  
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    // Send initial message to simulate loading
    const loadingMessage = await message.reply({
      content: 'Claiming your daily rewards...'
    });
    
    try {
      // Get user ID
      const userId = message.author.id;
      
      // Claim daily reward
      const result = await DailyRewardService.claimDailyReward(userId);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Daily Coins`)
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
      
      // Edit the initial message with the embed
      await loadingMessage.edit({
        content: '',
        embeds: [embed]
      });
      
    } catch (error) {
      // Handle errors (like already claimed today)
      if (error instanceof Error) {
        await loadingMessage.edit({
          content: `❌ ${error.message}`,
          embeds: []
        });
      } else {
        await loadingMessage.edit({
          content: '❌ An error occurred while claiming your daily reward.',
          embeds: []
        });
      }
    }
  }
}; 