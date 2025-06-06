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
        .setTitle('Daily Rewards')
        .setDescription(`You received **⏣ ${result.amount.toLocaleString()}** as your daily reward.`)
        .addFields(
          { name: 'Streak', value: `${result.streak} days (+⏣ ${result.streakBonus.toLocaleString()})`, inline: true },
          { name: 'Total', value: `⏣ ${result.total.toLocaleString()}`, inline: true }
        )
        .setFooter({ text: `Come back tomorrow to claim your next daily reward!` })
        .setTimestamp();
      
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