import { Client, Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';

export const command: PrefixCommand = {
  name: 'deposit',
  aliases: ['dep'],
  
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    try {
      const userId = message.author.id;
      
      // Check if amount is provided
      if (args.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ Please specify an amount to deposit.');
        
        await message.reply({ embeds: [errorEmbed] });
        return;
      }
      
      // Parse amount
      const amountStr = args[0].replace(/,/g, '');
      let amount: number;
      
      if (amountStr.toLowerCase() === 'all') {
        // Get all money from wallet
        const balanceInfo = await BalanceService.getUserBalance(userId);
        amount = balanceInfo.balance;
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
      
      // Check if user has enough in wallet
      if (amount > balanceInfo.balance) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`❌ You don't have that much money in your wallet! Your wallet balance is ⏣ ${balanceInfo.balance.toLocaleString()}.`);
        
        await message.reply({ embeds: [errorEmbed] });
        return;
      }
      
      // Process deposit
      await BalanceService.addBalance(userId, -amount);
      await BalanceService.addBankBalance(userId, amount);
      
      // Get updated balance
      const updatedBalance = await BalanceService.getUserBalance(userId);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#313136')
        .setTitle('Deposited')
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
      console.error('Error executing deposit command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while processing your deposit.');
      
      await message.reply({ embeds: [errorEmbed] });
    }
  }
}; 