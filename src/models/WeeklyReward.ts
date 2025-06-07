import mongoose, { Schema, Document } from 'mongoose';

// Define the WeeklyReward interface
export interface IWeeklyReward extends Document {
  userId: string;
  lastClaimed: Date;
  totalClaimed: number;
}

// Create the schema
const WeeklyRewardSchema = new Schema<IWeeklyReward>({
  userId: { type: String, required: true, unique: true },
  lastClaimed: { type: Date, default: new Date(0) }, // Default to epoch time
  totalClaimed: { type: Number, default: 0 }
});

// Create and export the model
export default mongoose.model<IWeeklyReward>('WeeklyReward', WeeklyRewardSchema); 