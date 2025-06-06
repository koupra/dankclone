import { Client, Events } from 'discord.js';

/**
 * Register the ready event handler
 * @param client Discord client instance
 */
export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log(`Serving ${readyClient.guilds.cache.size} guilds`);
  });
} 