import { Client, Events, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessagePayload, InteractionUpdateOptions, Message } from 'discord.js';
import { BalanceService } from '../services/BalanceService';
import config from '../config/config';

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
    } catch (error: any) {
      console.error('Error handling button interaction:', error);
      
      // Reply with error if interaction hasn't been replied to
      try {
        // Check if this is an Unknown Interaction error (code 10062)
        if (error.code === 10062) {
          // This is normal if the button was clicked multiple times
          return; // Don't attempt to respond again
        }
        
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
    } catch (error: any) {
      console.error('Error handling modal submission:', error);
      
      try {
        // Check if this is an Unknown Interaction error (code 10062)
        if (error.code === 10062) {
          // This is normal if the user took too long to respond
          return; // Don't attempt to respond again
        }
        
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
      .setLabel(`Amount (type "all" to withdraw everything)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Enter amount or "all"`)
      .setRequired(true)
      .setMaxLength(16);
    
    // Add input to modal
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents(firstActionRow);
    
    // Store the message ID for updating later
    if (interaction.message) {
      // Store the message ID in the modal's custom ID
      const messageId = interaction.message.id;
      modal.setCustomId(`withdraw-modal:${messageId}`);
    }
    
    // Show the modal
    try {
      await interaction.showModal(modal);
    } catch (modalError: any) {
      if (modalError.code === 10062) {
        // Interaction expired when showing withdraw modal
        return;
      }
      throw modalError; // Re-throw for the main handler to deal with
    }
    
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
      .setLabel(`Amount (type "all" to deposit everything)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Enter amount or "all"`)
      .setRequired(true)
      .setMaxLength(16);
    
    // Add input to modal
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents(firstActionRow);
    
    // Store the message ID for updating later
    if (interaction.message) {
      // Store the message ID in the modal's custom ID
      const messageId = interaction.message.id;
      modal.setCustomId(`deposit-modal:${messageId}`);
    }
    
    // Show the modal
    try {
      await interaction.showModal(modal);
    } catch (modalError: any) {
      if (modalError.code === 10062) {
        // Interaction expired when showing deposit modal
        return;
      }
      throw modalError; // Re-throw for the main handler to deal with
    }
    
  } catch (error) {
    console.error('Error in deposit handler:', error);
    throw error; // Let the main handler deal with it
  }
}

/**
 * Handle withdraw modal submission
 */
async function handleWithdrawModalSubmit(interaction: any): Promise<void> {
  try {
    await interaction.deferReply();
    
    try {
      const userId = interaction.user.id;
      const amountStr = interaction.fields.getTextInputValue('withdraw-amount');
      
      // Get current balance
      const balanceInfo = await BalanceService.getUserBalance(userId);
      
      // Parse amount, handling formats like "1,000", "1000", or "all"
      let amount: number;
      
      if (amountStr.toLowerCase() === 'all') {
        // Withdraw all money from bank
        amount = balanceInfo.bankBalance;
      } else {
        // Parse numeric amount
        amount = parseInt(amountStr.replace(/,/g, ''));
      }
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.editReply({
          content: '❌ Please enter a valid positive number or "all".'
        });
        return;
      }
      
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
                `🏦 ${updatedBalance.bankBalance.toLocaleString()} / ${config.economy.maxBankBalance.toLocaleString()}\n` +
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
      } catch (updateError: any) {
        console.error('Error updating original balance message:', updateError);
        
        // Check if this is an Unknown Interaction error
        if (updateError.code === 10062) {
          return; // Don't attempt to respond again
        }
        
        // Send a minimal confirmation if updating the original message fails
        try {
          await interaction.editReply({
            content: `Transaction completed.`
          });
        } catch (replyError) {
          console.error('Failed to send completion message:', replyError);
        }
      }
      
    } catch (processError: any) {
      console.error('Error processing withdrawal:', processError);
      
      // Check if this is an Unknown Interaction error
      if (processError.code === 10062) {
        return; // Don't attempt to respond again
      }
      
      try {
        await interaction.editReply({
          content: '❌ An error occurred while processing your withdrawal.'
        });
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  } catch (deferError: any) {
    console.error('Error deferring reply for withdraw modal:', deferError);
    // No need to respond here, as we couldn't even defer the reply
  }
}

/**
 * Handle deposit modal submission
 */
async function handleDepositModalSubmit(interaction: any): Promise<void> {
  try {
    await interaction.deferReply();
    
    try {
      const userId = interaction.user.id;
      const amountStr = interaction.fields.getTextInputValue('deposit-amount');
      
      // Get current balance
      const balanceInfo = await BalanceService.getUserBalance(userId);
      
      // Parse amount, handling formats like "1,000", "1000", or "all"
      let amount: number;
      
      if (amountStr.toLowerCase() === 'all') {
        // Deposit all money from wallet
        amount = balanceInfo.balance;
      } else {
        // Parse numeric amount
        amount = parseInt(amountStr.replace(/,/g, ''));
      }
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.editReply({
          content: '❌ Please enter a valid positive number or "all".'
        });
        return;
      }
      
      // Check if user has enough in wallet
      if (amount > balanceInfo.balance) {
        await interaction.editReply({
          content: `❌ You don't have that much money in your wallet! Your wallet balance is ⏣ ${balanceInfo.balance.toLocaleString()}.`
        });
        return;
      }
      
      // Check if deposit would exceed max bank balance
      if (balanceInfo.bankBalance + amount > config.economy.maxBankBalance) {
        const spaceLeft = config.economy.maxBankBalance - balanceInfo.bankBalance;
        await interaction.editReply({
          content: `❌ This deposit would exceed your bank's capacity! You can only deposit ⏣ ${spaceLeft.toLocaleString()} more.`
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
                `🏦 ${updatedBalance.bankBalance.toLocaleString()} / ${config.economy.maxBankBalance.toLocaleString()}\n` +
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
      } catch (updateError: any) {
        console.error('Error updating original balance message:', updateError);
        
        // Check if this is an Unknown Interaction error
        if (updateError.code === 10062) {
          return; // Don't attempt to respond again
        }
        
        // Send a minimal confirmation if updating the original message fails
        try {
          await interaction.editReply({
            content: `Transaction completed.`
          });
        } catch (replyError) {
          console.error('Failed to send completion message:', replyError);
        }
      }
      
    } catch (processError: any) {
      console.error('Error processing deposit:', processError);
      
      // Check if this is an Unknown Interaction error
      if (processError.code === 10062) {
        return; // Don't attempt to respond again
      }
      
      try {
        await interaction.editReply({
          content: '❌ An error occurred while processing your deposit.'
        });
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  } catch (deferError: any) {
    console.error('Error deferring reply for deposit modal:', deferError);
    // No need to respond here, as we couldn't even defer the reply
  }
}