import { ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';
import { BalanceService } from '../../services/BalanceService';

export const command: SlashCommand = {
  name: 'balance',
  description: 'Check your balance or another user\'s balance',
  options: [
    {
      name: 'user',
      description: 'The user to check the balance of',
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer reply
    await interaction.deferReply();
    
    try {
      // Get target user (mentioned user or command user)
      const targetUser = interaction.options.getUser('user') || interaction.user;
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
      if (targetUser.id === interaction.user.id) {
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
        
        await interaction.editReply({ 
          embeds: [embed],
          components: [row]
        });
      } else {
        await interaction.editReply({ 
          embeds: [embed]
        });
      }
      
    } catch (error) {
      console.error('Error executing balance command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('❌ An error occurred while checking the balance.');
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}; 