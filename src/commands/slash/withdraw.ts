import { ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';

export const command: SlashCommand = {
  name: 'withdraw',
  description: 'Withdraw money from your bank to your wallet',
  options: [
    {
      name: 'amount',
      description: 'The amount to withdraw',
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
      
      // Check if user has enough in bank
      if (amount > balanceInfo.bankBalance) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`❌ You don't have that much money in your bank! Your bank balance is ⏣ ${balanceInfo.bankBalance.toLocaleString()}.`);
        
        await interaction.editReply({ embeds: [errorEmbed] });
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
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error executing withdraw command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while processing your withdrawal.');
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}; 