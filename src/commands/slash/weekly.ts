import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../interfaces/Command';

export const command: SlashCommand = {
  name: 'weekly',
  description: 'Claim your weekly rewards',
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer reply
    await interaction.deferReply();
    
    try {
      // Get user ID
      const userId = interaction.user.id;
      
      // Simulate claiming weekly reward
      const amount = 2000000;
      
      // Calculate next weekly time (7 days from now)
      const nextWeekly = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const msLeft = nextWeekly.getTime() - Date.now();
      const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24)); // Convert ms → days
      const cooldownText = `in ${daysLeft} days`;

      const embed = new EmbedBuilder()
      .setAuthor({
          name: `${interaction.user.username}'s Weekly Coins`,
          iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor('#2b2d31') // Discord dark gray
      .setDescription('Run this command every week to get a moderate sum of coins!')
      .addFields([
          {
          name: 'You received:',
          value: `• <:coin:123456789012345678> **${amount.toLocaleString()}**`,
          },
      ])
      .setFooter({ text: `Claim again ${cooldownText}` });

      // Send the embed
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setDescription('❌ An error occurred while claiming your weekly reward.');
      
        await interaction.editReply({
            content: '',
            embeds: [errorEmbed]
          });
        }
      }
    }; 