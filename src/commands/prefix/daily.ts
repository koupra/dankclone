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
      
      // Calculate next daily time (24 hours from now)
      const nextDaily = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const unixTimestamp = Math.floor(nextDaily.getTime() / 1000); // Convert to UNIX seconds

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Daily Coins`)
        .setColor('#313136')
        .setDescription(`> ⏣ ${result.total.toLocaleString()} was placed in your wallet!`)
        .addFields(
          // Top row
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
            name: '\u200b',
            value: '\u200b',
            inline: true
          },
          // Bottom row
          {
            name: 'Next Daily',
            value: `<t:${unixTimestamp}:R>`, // This will show "in 24 hours" and update in real time
            inline: true
          },
          {
            name: 'Streak',
            value: `${result.streak}`,
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
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
          const errorEmbed = new EmbedBuilder()
            .setDescription(`You already got your daily today! Try again ${timeRemaining}`);
          
          await loadingMessage.edit({
            content: '',
            embeds: [errorEmbed]
          });
        } else {
          const errorEmbed = new EmbedBuilder()
            .setDescription(`❌ ${errorMessage}`);
          
          await loadingMessage.edit({
            content: '',
            embeds: [errorEmbed]
          });
        }
      } else {
        const errorEmbed = new EmbedBuilder()
          .setDescription('❌ An error occurred while claiming your daily reward.');
        
        await loadingMessage.edit({
          content: '',
          embeds: [errorEmbed]
        });
      }
    }
  }
}; 