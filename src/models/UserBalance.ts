import mongoose, { Schema, Document } from 'mongoose';

// Define the UserBalance interface
export interface IUserBalance extends Document {
  userId: string;
  balance: number;
  bankBalance: number;
  lastUpdated: Date;
}

// Create the schema
const UserBalanceSchema = new Schema<IUserBalance>({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  bankBalance: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Create and export the model
export default mongoose.model<IUserBalance>('UserBalance', UserBalanceSchema); 