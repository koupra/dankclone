import { ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';
import config from '../../config/config';

export const command: SlashCommand = {
  name: 'deposit',
  description: 'Deposit money from your wallet to your bank',
  options: [
    {
      name: 'amount',
      description: 'The amount to deposit',
      type: ApplicationCommandOptionType.Integer,
      required: true
    }
  ],
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer reply
    await interaction.deferReply();
    
    try {
      const userId = interaction.user.id;
      const amount = interaction.options.getInteger('amount');
      
      if (!amount || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription('❌ Please enter a valid positive amount.');
        
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }
      
      // Get current balance
      const balanceInfo = await BalanceService.getUserBalance(userId);
      
      // Check if user has enough in wallet
      if (amount > balanceInfo.balance) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`❌ You don't have that much money in your wallet! Your wallet balance is ⏣ ${balanceInfo.balance.toLocaleString()}.`);
        
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }
      
      // Check if deposit would exceed max bank balance
      if (balanceInfo.bankBalance + amount > config.economy.maxBankBalance) {
        const spaceLeft = config.economy.maxBankBalance - balanceInfo.bankBalance;
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`❌ This deposit would exceed your bank's capacity! You can only deposit ⏣ ${spaceLeft.toLocaleString()} more.`);
        
        await interaction.editReply({ embeds: [errorEmbed] });
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
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error executing deposit command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while processing your deposit.');
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}; 