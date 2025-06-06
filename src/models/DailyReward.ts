import mongoose, { Schema, Document } from 'mongoose';

// Define the DailyReward interface
export interface IDailyReward extends Document {
  userId: string;
  lastClaimed: Date;
  streak: number;
  totalClaimed: number;
}

// Create the schema
const DailyRewardSchema = new Schema<IDailyReward>({
  userId: { type: String, required: true, unique: true },
  lastClaimed: { type: Date, default: new Date(0) }, // Default to epoch time
  streak: { type: Number, default: 0 },
  totalClaimed: { type: Number, default: 0 }
});

// Create and export the model
export default mongoose.model<IDailyReward>('DailyReward', DailyRewardSchema); 