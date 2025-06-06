import { Client, Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';

export const command: PrefixCommand = {
  name: 'withdraw',
  aliases: ['with'],
  
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    try {
      const userId = message.author.id;
      
      // Check if amount is provided
      if (args.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ Please specify an amount to withdraw.');
        
        await message.reply({ embeds: [errorEmbed] });
        return;
      }
      
      // Parse amount
      const amountStr = args[0].replace(/,/g, '');
      let amount: number;
      
      if (amountStr.toLowerCase() === 'all') {
        // Get all money from bank
        const balanceInfo = await BalanceService.getUserBalance(userId);
        amount = balanceInfo.bankBalance;
      } else {
        amount = parseInt(amountStr);
      }
      
      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ Please enter a valid positive amount.');
        
        await message.reply({ embeds: [errorEmbed] });
        return;
      }
      
      // Get current balance
      const balanceInfo = await BalanceService.getUserBalance(userId);
      
      // Check if user has enough in bank
      if (amount > balanceInfo.bankBalance) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`❌ You don't have that much money in your bank! Your bank balance is ⏣ ${balanceInfo.bankBalance.toLocaleString()}.`);
        
        await message.reply({ embeds: [errorEmbed] });
        return;
      }
      
      // Process withdrawal
      await BalanceService.addBankBalance(userId, -amount);
      await BalanceService.addBalance(userId, amount);
      
      // Get updated balance
      const updatedBalance = await BalanceService.getUserBalance(userId);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#313136')
        .setTitle('Withdrawn')
        .setDescription(`⏣ ${amount.toLocaleString()}`)
        .addFields(
          { 
            name: 'Current Wallet Balance', 
            value: `⏣ ${updatedBalance.balance.toLocaleString()}`,
            inline: true 
          },
          { 
            name: 'Current Bank Balance', 
            value: `⏣ ${updatedBalance.bankBalance.toLocaleString()}`,
            inline: true 
          }
        );
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error executing withdraw command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while processing your withdrawal.');
      
      await message.reply({ embeds: [errorEmbed] });
    }
  }
}; 