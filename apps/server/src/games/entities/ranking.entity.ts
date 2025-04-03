import { PlatformGame } from '@/games/entities/platform-game.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rankings')
export class Ranking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  rank_date!: Date;

  @Column()
  rank_type!: string;

  @Column()
  position!: number;

  @Column()
  fans_count!: number;

  @Column()
  hits_total!: number;

  @Column()
  hits_total_val!: number;

  @Column()
  wish_count!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(
    () => PlatformGame,
    (platformGame: PlatformGame) => platformGame.rankings,
  )
  @JoinColumn({ name: 'platform_game_id' })
  platformGame!: PlatformGame;

  constructor(partial: Partial<Ranking> = {}) {
    Object.assign(this, partial);
  }
}
