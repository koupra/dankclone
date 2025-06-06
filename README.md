# Discord Bot with TypeScript and MongoDB

A Discord bot template built with TypeScript and MongoDB integration.

## Features

- TypeScript support
- MongoDB integration
- Environment-based configuration
- Event-based architecture

## Prerequisites

- Node.js (v16.9.0 or higher)
- npm or yarn
- MongoDB server (local or remote)
- Discord bot token (from Discord Developer Portal)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env` file and fill in your details:
     ```
     # Discord Bot Configuration
     DISCORD_TOKEN=your_discord_bot_token_here
     DISCORD_CLIENT_ID=your_discord_client_id_here

     # MongoDB Configuration
     MONGODB_URI=mongodb://localhost:27017/discord_bot
     ```

## Development

Run the bot in development mode:

```bash
npm run dev
```

## Building for Production

Build the TypeScript code:

```bash
npm run build
```

Start the bot in production:

```bash
npm start
```

## Project Structure

```
.
├── src/
│   ├── config/       # Configuration files
│   ├── events/       # Discord event handlers
│   ├── models/       # MongoDB models
│   ├── utils/        # Utility functions
│   └── index.ts      # Entry point
├── .env              # Environment variables
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Adding Commands

To add commands, create a new directory `src/commands` and implement your command handlers there.

## License

MIT 