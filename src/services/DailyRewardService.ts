import DailyReward, { IDailyReward } from '../models/DailyReward';
import UserBalance from '../models/UserBalance';

export interface DailyRewardResult {
  amount: number;
  streak: number;
  streakBonus: number;
  total: number;
  isNewStreak: boolean;
}

export class DailyRewardService {
  // Base reward amount
  private static BASE_REWARD = 100000;
  // Streak bonus per day
  private static STREAK_BONUS_PER_DAY = 1000;
  // 24 hours in milliseconds
  private static DAY_MS = 24 * 60 * 60 * 1000;
  // 48 hours in milliseconds (for streak reset)
  private static TWO_DAYS_MS = 2 * DailyRewardService.DAY_MS;

  /**
   * Claim daily reward for a user
   * @param userId The Discord user ID
   * @returns The reward result
   */
  public static async claimDailyReward(userId: string): Promise<DailyRewardResult> {
    // Get or create user's daily reward record
    let dailyReward = await DailyReward.findOne({ userId });
    
    if (!dailyReward) {
      dailyReward = new DailyReward({ userId });
    }
    
    const now = new Date();
    const lastClaimed = dailyReward.lastClaimed;
    const timeSinceLastClaim = now.getTime() - lastClaimed.getTime();
    
    // Check if 24 hours have passed since last claim
    if (timeSinceLastClaim < DailyRewardService.DAY_MS) {
      const timeRemaining = DailyRewardService.DAY_MS - timeSinceLastClaim;
      const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      
      throw new Error(`You can claim your next daily reward in ${hoursRemaining}h ${minutesRemaining}m`);
    }
    
    // Check if streak should be reset (more than 48 hours since last claim)
    const isNewStreak = timeSinceLastClaim >= DailyRewardService.TWO_DAYS_MS;
    
    // Update streak
    if (isNewStreak) {
      dailyReward.streak = 1;
    } else {
      dailyReward.streak += 1;
    }
    
    // Calculate reward
    const amount = DailyRewardService.BASE_REWARD;
    
    // Calculate streak bonus (1000 per streak day)
    const streakBonus = dailyReward.streak * DailyRewardService.STREAK_BONUS_PER_DAY;
    
    // Calculate total
    const total = amount + streakBonus;
    
    // Update user's record
    dailyReward.lastClaimed = now;
    dailyReward.totalClaimed += total;
    await dailyReward.save();
    
    // Update user's balance
    await UserBalance.findOneAndUpdate(
      { userId },
      { $inc: { balance: total }, $set: { lastUpdated: now } },
      { upsert: true }
    );
    
    // Return result
    return {
      amount,
      streak: dailyReward.streak,
      streakBonus,
      total,
      isNewStreak
    };
  }
} 