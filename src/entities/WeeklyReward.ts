import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class WeeklyReward {
  @PrimaryColumn()
  userId: string;

  @Column({ type: 'timestamp', default: () => `'1970-01-01 00:00:00'` })
  lastClaimed: Date;

  @Column({ type: 'bigint', default: 0 })
  totalClaimed: number;
} 