import { Client, Collection, REST, Routes, Events, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from '../config/config';
import { SlashCommand, PrefixCommand } from '../interfaces/Command';

// Collections to store commands
export const slashCommands = new Collection<string, SlashCommand>();
export const prefixCommands = new Collection<string, PrefixCommand>();
export const prefixAliases = new Collection<string, string>();

// Prefix for commands
const PREFIX = 'pls';

/**
 * Load all commands
 */
export async function loadCommands(client: Client): Promise<void> {
  try {
    // Load slash commands
    const slashCommandsPath = path.join(__dirname, '..', 'commands', 'slash');
    const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    const commands = [];
    
    for (const file of slashCommandFiles) {
      const filePath = path.join(slashCommandsPath, file);
      const { command } = await import(filePath);
      
      if ('name' in command && 'execute' in command) {
        slashCommands.set(command.name, command);
        commands.push({
          name: command.name,
          description: command.description,
        });
        console.log(`Loaded slash command: ${command.name}`);
      } else {
        console.warn(`The slash command at ${filePath} is missing required properties.`);
      }
    }
    
    // Register slash commands with Discord API
    if (config.discord.token && config.discord.clientId) {
      const rest = new REST({ version: '10' }).setToken(config.discord.token);
      
      try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
          Routes.applicationCommands(config.discord.clientId),
          { body: commands },
        );
        
        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error('Failed to refresh application (/) commands:', error);
      }
    }
    
    // Load prefix commands
    const prefixCommandsPath = path.join(__dirname, '..', 'commands', 'prefix');
    const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    for (const file of prefixCommandFiles) {
      const filePath = path.join(prefixCommandsPath, file);
      const { command } = await import(filePath);
      
      if ('name' in command && 'execute' in command) {
        prefixCommands.set(command.name, command);
        console.log(`Loaded prefix command: ${command.name}`);
        
        // Register aliases
        if (command.aliases && Array.isArray(command.aliases)) {
          command.aliases.forEach((alias: string) => {
            prefixAliases.set(alias, command.name);
          });
        }
      } else {
        console.warn(`The prefix command at ${filePath} is missing required properties.`);
      }
    }
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}

/**
 * Handle message events for prefix commands
 */
export function setupMessageHandler(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots or without the prefix
    if (message.author.bot || !message.content.toLowerCase().startsWith(PREFIX)) return;
    
    // Parse the command and arguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    
    if (!commandName) return;
    
    // Find the command by name or alias
    const command = prefixCommands.get(commandName) || 
                    prefixCommands.get(prefixAliases.get(commandName) || '');
    
    if (!command) return;
    
    try {
      // Execute the command
      await command.execute(client, message, args);
    } catch (error) {
      console.error(`Error executing prefix command ${commandName}:`, error);
      message.reply({ content: 'There was an error executing that command!' }).catch(console.error);
    }
  });
}

/**
 * Handle interaction events for slash commands
 */
export function setupInteractionHandler(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = slashCommands.get(interaction.commandName);
    
    if (!command) return;
    
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing slash command ${interaction.commandName}:`, error);
      
      const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });
} 