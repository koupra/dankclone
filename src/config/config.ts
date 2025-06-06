import { config } from 'dotenv';

// Load environment variables
config();

// Export configuration object
export default {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/discord_bot',
  },
  // Add more configuration options as needed
}; 