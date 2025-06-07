import { Client, GatewayIntentBits } from 'discord.js';
import config from './config/config';
import { connectToDatabase } from './utils/database';
import { registerReadyEvent } from './events/ready';
import { registerButtonInteractionEvent } from './events/buttonInteraction';
import { loadCommands, setupMessageHandler, setupInteractionHandler } from './handlers/commandHandler';
import { AppDataSource } from './utils/data-source';
import mongoose from 'mongoose';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register events
registerReadyEvent(client);
registerButtonInteractionEvent(client);

// Setup command handlers
setupMessageHandler(client);
setupInteractionHandler(client);

// Initialize PostgreSQL (TypeORM)
AppDataSource.initialize()
  .then(() => {
    console.log('TypeORM (PostgreSQL) Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during TypeORM Data Source initialization:', err);
  });

// Initialize MongoDB (Mongoose)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rewardsdb';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Mongoose (MongoDB) connection established!');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Start the bot
async function main() {
  try {
    // Connect to MongoDB first
    await connectToDatabase();
    
    // Load commands
    await loadCommands(client);
    
    // Login to Discord
    const token = config.discord.token;
    
    if (!token) {
      throw new Error('Discord token is not defined in configuration');
    }
    
    await client.login(token);
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Bot is shutting down...');
  client.destroy();
  process.exit(0);
});

// Start the application
main(); 