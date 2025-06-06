import mongoose from 'mongoose';
import config from '../config/config';

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<void> {
  try {
    const mongoUri = config.mongodb.uri;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in configuration');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
} 