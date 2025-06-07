import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class UserBalance {
  @PrimaryColumn()
  userId: string;

  @Column({ type: 'bigint', default: 0 })
  balance: number;

  @Column({ type: 'bigint', default: 0 })
  bankBalance: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
} 