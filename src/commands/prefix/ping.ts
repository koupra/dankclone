import { Client, Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';

export const command: PrefixCommand = {
  name: 'ping',
  aliases: ['latency', 'pong'],
  
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    // Record the timestamp when the command was received
    const receivedTimestamp = Date.now();
    
    // Create initial embed
    const initialEmbed = new EmbedBuilder()
      .setTitle('Ping!')
      .setDescription('Calculating ping...');
    
    // Send the initial message
    const sentMessage = await message.reply({
      embeds: [initialEmbed]
    });
    
    // Calculate initial response time
    const initialResponseTime = Date.now() - receivedTimestamp;
    
    // Wait a moment to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Calculate the round-trip time
    const roundTripTime = Date.now() - receivedTimestamp;
    
    // Create final embed
    const finalEmbed = new EmbedBuilder()
      .setTitle('Ping!')
      .setDescription(`Initial response: ${initialResponseTime}ms\nRound-trip: ${roundTripTime}ms`);
    
    // Edit the message with the complete information
    await sentMessage.edit({
      embeds: [finalEmbed]
    });
  }
}; 