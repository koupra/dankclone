import WeeklyReward, { IWeeklyReward } from '../models/WeeklyReward';
import UserBalance from '../models/UserBalance';

export interface WeeklyRewardResult {
  amount: number;
  total: number;
}

export class WeeklyRewardService {
  // Base reward amount
  private static BASE_REWARD = 2000000;
  // 7 days in milliseconds
  private static WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  // Owner user ID that bypasses cooldowns
  private static OWNER_ID = "807822793327509544";

  /**
   * Claim weekly reward for a user
   * @param userId The Discord user ID
   * @returns The reward result
   */
  public static async claimWeeklyReward(userId: string): Promise<WeeklyRewardResult> {
    // Get or create user's weekly reward record
    let weeklyReward = await WeeklyReward.findOne({ userId });
    if (!weeklyReward) {
      weeklyReward = new WeeklyReward({ userId });
    }

    const now = new Date();
    const lastClaimed = weeklyReward.lastClaimed;
    const timeSinceLastClaim = now.getTime() - lastClaimed.getTime();

    // Check if 7 days have passed since last claim (skip for owner)
    if (timeSinceLastClaim < WeeklyRewardService.WEEK_MS && userId !== WeeklyRewardService.OWNER_ID) {
      const timeRemaining = WeeklyRewardService.WEEK_MS - timeSinceLastClaim;
      const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      throw new Error(`You can claim your next weekly reward in ${daysRemaining}d ${hoursRemaining}h`);
    }

    // Calculate reward
    const amount = WeeklyRewardService.BASE_REWARD;
    const total = amount;

    // Update user's record
    weeklyReward.lastClaimed = now;
    weeklyReward.totalClaimed += total;
    await weeklyReward.save();

    // Update user's balance
    await UserBalance.findOneAndUpdate(
      { userId },
      { $inc: { balance: total }, $set: { lastUpdated: now } },
      { upsert: true }
    );

    // Return result
    return {
      amount,
      total
    };
  }
} 