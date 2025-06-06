import UserBalance from '../models/UserBalance';
import config from '../config/config';

export interface UserBalanceInfo {
  balance: number;
  bankBalance: number;
  globalRank?: number;
}

export class BalanceService {
  /**
   * Get a user's balance information
   * @param userId The Discord user ID
   * @returns The user's balance information
   */
  public static async getUserBalance(userId: string): Promise<UserBalanceInfo> {
    // Get or create user's balance record
    let userBalance = await UserBalance.findOne({ userId });
    
    if (!userBalance) {
      userBalance = new UserBalance({ 
        userId,
        balance: 0,
        bankBalance: 0
      });
      await userBalance.save();
    }
    
    // Calculate a mock global rank (in a real app, this would be more sophisticated)
    const totalUsers = await UserBalance.countDocuments();
    const usersWithMoreMoney = await UserBalance.countDocuments({
      $or: [
        { balance: { $gt: userBalance.balance } },
        { 
          balance: userBalance.balance,
          userId: { $lt: userId }  // Tiebreaker using userId
        }
      ]
    });
    
    const globalRank = usersWithMoreMoney + 1;
    
    return {
      balance: userBalance.balance,
      bankBalance: userBalance.bankBalance,
      globalRank
    };
  }
  
  /**
   * Add money to a user's balance
   * @param userId The Discord user ID
   * @param amount The amount to add
   * @returns The updated balance
   */
  public static async addBalance(userId: string, amount: number): Promise<number> {
    const result = await UserBalance.findOneAndUpdate(
      { userId },
      { 
        $inc: { balance: amount },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );
    
    return result.balance;
  }
  
  /**
   * Add money to a user's bank
   * @param userId The Discord user ID
   * @param amount The amount to add
   * @returns The updated bank balance
   */
  public static async addBankBalance(userId: string, amount: number): Promise<number> {
    // Get current bank balance
    const userBalance = await UserBalance.findOne({ userId });
    
    // If adding money, enforce max bank balance
    if (amount > 0 && userBalance) {
      const newBankBalance = userBalance.bankBalance + amount;
      
      // Cap at max bank balance
      if (newBankBalance > config.economy.maxBankBalance) {
        amount = config.economy.maxBankBalance - userBalance.bankBalance;
      }
    }
    
    const result = await UserBalance.findOneAndUpdate(
      { userId },
      { 
        $inc: { bankBalance: amount },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );
    
    return result.bankBalance;
  }
} 