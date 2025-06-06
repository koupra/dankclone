import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';

export const command: SlashCommand = {
  name: 'ping',
  description: 'Replies with the bot\'s latency',
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Record the timestamp when the command was received
    const receivedTimestamp = Date.now();
    
    // Defer the reply to calculate the initial response time
    await interaction.deferReply();
    
    // Calculate initial response time
    const initialResponseTime = Date.now() - receivedTimestamp;
    
    // Create initial embed
    const initialEmbed = new EmbedBuilder()
      .setTitle('Ping!')
      .setDescription(`Initial response: ${initialResponseTime}ms\nCalculating round-trip...`);
    
    // Send the initial response
    await interaction.editReply({
      embeds: [initialEmbed]
    });
    
    // Calculate the round-trip time
    const roundTripTime = Date.now() - receivedTimestamp;
    
    // Create final embed
    const finalEmbed = new EmbedBuilder()
      .setTitle('Ping!')
      .setDescription(`Initial response: ${initialResponseTime}ms\nRound-trip: ${roundTripTime}ms`);
    
    // Edit the message with the complete information
    await interaction.editReply({
      embeds: [finalEmbed]
    });
  }
}; 