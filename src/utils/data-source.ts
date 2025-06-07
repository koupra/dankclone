import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserBalance } from '../entities/UserBalance';
import { DailyReward } from '../entities/DailyReward';
import { WeeklyReward } from '../entities/WeeklyReward';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'rewardsdb',
  synchronize: true, // Set to false in production and use migrations
  logging: false,
  entities: [UserBalance, DailyReward, WeeklyReward],
}); 