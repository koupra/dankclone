import { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';

export const command: PrefixCommand = {
  name: 'balance',
  aliases: ['bal', 'wallet'],
  
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    try {
      // Get target user (mentioned user or command user)
      const targetUser = message.mentions.users.first() || message.author;
      const userId = targetUser.id;
      
      // Get balance information
      const balanceInfo = await BalanceService.getUserBalance(userId);
      
      // Format numbers with commas
      const formattedBalance = balanceInfo.balance.toLocaleString();
      const formattedBankBalance = balanceInfo.bankBalance.toLocaleString();
      const maxBankBalance = (17373077).toLocaleString(); // Example max bank balance
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#313136')
        .setTitle(`${targetUser.username}'s Balances`)
        .setDescription(
          `🪙 ${formattedBalance}\n` +
          `🏦 ${formattedBankBalance} / ${maxBankBalance}\n` +
          `\n` +
          `Global Rank: #${balanceInfo.globalRank?.toLocaleString() || '???'}`
        );
      
      // Only show buttons if checking own balance
      if (targetUser.id === message.author.id) {
        // Create buttons for withdraw/deposit
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('withdraw')
              .setLabel('Withdraw')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(balanceInfo.bankBalance <= 0), // Disable if no bank balance
            new ButtonBuilder()
              .setCustomId('deposit')
              .setLabel('Deposit')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(balanceInfo.balance <= 0) // Disable if no wallet balance
          );
        
        await message.reply({ 
          embeds: [embed],
          components: [row]
        });
      } else {
        await message.reply({ 
          embeds: [embed]
        });
      }
      
    } catch (error) {
      console.error('Error executing balance command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while checking the balance.');
      
      await message.reply({ embeds: [errorEmbed] });
    }
  }
}; 