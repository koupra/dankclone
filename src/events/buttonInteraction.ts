import { Client, Events, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessagePayload, InteractionUpdateOptions, Message } from 'discord.js';
import { BalanceService } from '../services/BalanceService';

/**
 * Register the button interaction event handler
 * @param client Discord client instance
 */
export function registerButtonInteractionEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    
    // Handle different button interactions
    try {
      const customId = interaction.customId;
      
      switch (customId) {
        case 'withdraw':
          await handleWithdraw(interaction);
          break;
        case 'deposit':
          await handleDeposit(interaction);
          break;
        default:
          console.warn(`Unknown button interaction: ${customId}`);
          // Respond to unknown buttons to prevent interaction failures
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'This button is not yet implemented.',
              ephemeral: true
            }).catch(err => console.error('Failed to reply to unknown button:', err));
          }
      }
    } catch (error) {
      console.error('Error handling button interaction:', error);
      
      // Reply with error if interaction hasn't been replied to
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing this button.',
            ephemeral: true
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: 'An error occurred while processing this button.'
          });
        }
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  });
  
  // Handle modal submissions
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    try {
      const customId = interaction.customId.split(':')[0]; // Extract base customId without message ID
      
      if (customId === 'withdraw-modal') {
        await handleWithdrawModalSubmit(interaction);
      } else if (customId === 'deposit-modal') {
        await handleDepositModalSubmit(interaction);
      }
    } catch (error) {
      console.error('Error handling modal submission:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing your request.',
            ephemeral: true
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: 'An error occurred while processing your request.'
          });
        }
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  });
}

/**
 * Handle withdraw button click
 */
async function handleWithdraw(interaction: ButtonInteraction): Promise<void> {
  try {
    // Get user's balance
    const userId = interaction.user.id;
    const balanceInfo = await BalanceService.getUserBalance(userId);
    
    // Create modal for withdrawal amount
    const modal = new ModalBuilder()
      .setCustomId('withdraw-modal')
      .setTitle('Withdraw');
    
    // Create text input for amount
    const amountInput = new TextInputBuilder()
      .setCustomId('withdraw-amount')
      .setLabel(`Amount: - Must be between 0 and 16 in length.`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('')
      .setRequired(true)
      .setMaxLength(16);
    
    // Add input to modal
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents(firstActionRow);
    
    // Store the message ID for updating later
    if (interaction.message) {
      // Store the message ID in the modal's custom ID
      modal.setCustomId(`withdraw-modal:${interaction.message.id}`);
    }
    
    // Show the modal
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in withdraw handler:', error);
    throw error; // Let the main handler deal with it
  }
}

/**
 * Handle deposit button click
 */
async function handleDeposit(interaction: ButtonInteraction): Promise<void> {
  try {
    // Get user's balance
    const userId = interaction.user.id;
    const balanceInfo = await BalanceService.getUserBalance(userId);
    
    // Create modal for deposit amount
    const modal = new ModalBuilder()
      .setCustomId('deposit-modal')
      .setTitle('Deposit');
    
    // Create text input for amount
    const amountInput = new TextInputBuilder()
      .setCustomId('deposit-amount')
      .setLabel(`Amount: - Must be between 0 and 16 in length.`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('')
      .setRequired(true)
      .setMaxLength(16);
    
    // Add input to modal
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents(firstActionRow);
    
    // Store the message ID for updating later
    if (interaction.message) {
      // Store the message ID in the modal's custom ID
      modal.setCustomId(`deposit-modal:${interaction.message.id}`);
    }
    
    // Show the modal
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in deposit handler:', error);
    throw error; // Let the main handler deal with it
  }
}

/**
 * Handle withdraw modal submission
 */
async function handleWithdrawModalSubmit(interaction: any): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    const userId = interaction.user.id;
    const amountStr = interaction.fields.getTextInputValue('withdraw-amount');
    
    // Parse amount, handling formats like "1,000" or "1000"
    const amount = parseInt(amountStr.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      await interaction.editReply({
        content: '❌ Please enter a valid positive number.'
      });
      return;
    }
    
    // Get current balance
    const balanceInfo = await BalanceService.getUserBalance(userId);
    
    // Check if user has enough in bank
    if (amount > balanceInfo.bankBalance) {
      await interaction.editReply({
        content: `❌ You don't have that much money in your bank! Your bank balance is ⏣ ${balanceInfo.bankBalance.toLocaleString()}.`
      });
      return;
    }
    
    // Process withdrawal
    await BalanceService.addBankBalance(userId, -amount);
    await BalanceService.addBalance(userId, amount);
    
    // Get updated balance
    const updatedBalance = await BalanceService.getUserBalance(userId);
    
    // Update the original balance message
    try {
      // Extract the message ID from the modal's custom ID
      const customIdParts = interaction.customId.split(':');
      if (customIdParts.length > 1) {
        const messageId = customIdParts[1];
        
        // Get the original message
        const originalMessage = await interaction.channel?.messages.fetch(messageId);
        
        if (originalMessage && originalMessage.embeds.length > 0) {
          // Get the original embed
          const originalEmbed = originalMessage.embeds[0];
          
          // Create updated embed with new balance
          const updatedEmbed = {
            title: originalEmbed.title,
            color: originalEmbed.color,
            description: 
              `🪙 ${updatedBalance.balance.toLocaleString()}\n` +
              `🏦 ${updatedBalance.bankBalance.toLocaleString()} / ${(17373077).toLocaleString()}\n` +
              `\n` +
              `Global Rank: #${updatedBalance.globalRank?.toLocaleString() || '???'}`,
          };
          
          // Update the message with the new embed
          await originalMessage.edit({ embeds: [updatedEmbed] });
          
          // Delete the interaction reply
          await interaction.deleteReply();
        } else {
          // If we can't find the original message or embed, send a minimal confirmation
          await interaction.editReply({
            content: `Transaction completed.`
          });
        }
      } else {
        // If we can't extract the message ID, send a minimal confirmation
        await interaction.editReply({
          content: `Transaction completed.`
        });
      }
    } catch (updateError) {
      console.error('Error updating original balance message:', updateError);
      // Send a minimal confirmation if updating the original message fails
      await interaction.editReply({
        content: `Transaction completed.`
      });
    }
    
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    await interaction.editReply({
      content: '❌ An error occurred while processing your withdrawal.'
    });
  }
}

/**
 * Handle deposit modal submission
 */
async function handleDepositModalSubmit(interaction: any): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    const userId = interaction.user.id;
    const amountStr = interaction.fields.getTextInputValue('deposit-amount');
    
    // Parse amount, handling formats like "1,000" or "1000"
    const amount = parseInt(amountStr.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      await interaction.editReply({
        content: '❌ Please enter a valid positive number.'
      });
      return;
    }
    
    // Get current balance
    const balanceInfo = await BalanceService.getUserBalance(userId);
    
    // Check if user has enough in wallet
    if (amount > balanceInfo.balance) {
      await interaction.editReply({
        content: `❌ You don't have that much money in your wallet! Your wallet balance is ⏣ ${balanceInfo.balance.toLocaleString()}.`
      });
      return;
    }
    
    // Process deposit
    await BalanceService.addBalance(userId, -amount);
    await BalanceService.addBankBalance(userId, amount);
    
    // Get updated balance
    const updatedBalance = await BalanceService.getUserBalance(userId);
    
    // Update the original balance message
    try {
      // Extract the message ID from the modal's custom ID
      const customIdParts = interaction.customId.split(':');
      if (customIdParts.length > 1) {
        const messageId = customIdParts[1];
        
        // Get the original message
        const originalMessage = await interaction.channel?.messages.fetch(messageId);
        
        if (originalMessage && originalMessage.embeds.length > 0) {
          // Get the original embed
          const originalEmbed = originalMessage.embeds[0];
          
          // Create updated embed with new balance
          const updatedEmbed = {
            title: originalEmbed.title,
            color: originalEmbed.color,
            description: 
              `🪙 ${updatedBalance.balance.toLocaleString()}\n` +
              `🏦 ${updatedBalance.bankBalance.toLocaleString()} / ${(17373077).toLocaleString()}\n` +
              `\n` +
              `Global Rank: #${updatedBalance.globalRank?.toLocaleString() || '???'}`,
          };
          
          // Update the message with the new embed
          await originalMessage.edit({ embeds: [updatedEmbed] });
          
          // Delete the interaction reply
          await interaction.deleteReply();
        } else {
          // If we can't find the original message or embed, send a minimal confirmation
          await interaction.editReply({
            content: `Transaction completed.`
          });
        }
      } else {
        // If we can't extract the message ID, send a minimal confirmation
        await interaction.editReply({
          content: `Transaction completed.`
        });
      }
    } catch (updateError) {
      console.error('Error updating original balance message:', updateError);
      // Send a minimal confirmation if updating the original message fails
      await interaction.editReply({
        content: `Transaction completed.`
      });
    }
    
  } catch (error) {
    console.error('Error processing deposit:', error);
    await interaction.editReply({
      content: '❌ An error occurred while processing your deposit.'
    });
  }
} 