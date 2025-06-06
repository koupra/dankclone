import mongoose, { Schema, Document } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  userId: string;
  username: string;
  joinedAt: Date;
  lastActive: Date;
}

// Create the schema
const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

// Create and export the model
export default mongoose.model<IUser>('User', UserSchema); 