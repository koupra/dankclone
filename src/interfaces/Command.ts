import { ChatInputCommandInteraction, Client, Message } from 'discord.js';

// Interface for slash commands
export interface SlashCommand {
  name: string;
  description: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Interface for prefix commands
export interface PrefixCommand {
  name: string;
  aliases?: string[];
  execute: (client: Client, message: Message, args: string[]) => Promise<void>;
} 