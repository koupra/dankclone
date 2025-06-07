import { Client, Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../interfaces/Command';

export const command: PrefixCommand = {
  name: 'weekly',
  async execute(client: Client, message: Message, args: string[]): Promise<void> {
    try {
      const amount = 2000000;
      const nextWeekly = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const msLeft = nextWeekly.getTime() - Date.now();
      const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
      const cooldownText = `in ${daysLeft} days`;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.username}'s Weekly Coins`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor('#2b2d31')
        .setDescription('Run this command every week to get a moderate sum of coins!')
        .addFields([
          {
            name: 'You received:',
            value: `• 🪙 **${amount.toLocaleString()}**`,
          },
        ])
        .setFooter({ text: `Claim again ${cooldownText}` });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ An error occurred while claiming your weekly reward.');
    }
  },
}; 