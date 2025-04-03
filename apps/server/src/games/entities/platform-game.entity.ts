import { Game } from '@/games/entities/game.entity';
import { Ranking } from '@/games/entities/ranking.entity';
import { Tag } from '@/games/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_games')
export class PlatformGame {
  @ApiProperty({
    description: '平台游戏ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: '平台',
    example: 'taptap',
  })
  @Column()
  platform!: 'taptap' | 'steam';

  @ApiProperty({
    description: '平台ID',
    example: '1234567890',
  })
  @Column()
  platform_id!: string;

  @ApiProperty({
    description: '游戏描述',
    example:
      '塞尔达传说：荒野之息是一款动作冒险游戏，玩家在游戏中扮演主角林克，探索开放世界，解谜，战斗等。',
  })
  @Column()
  description?: string;

  @ApiProperty({
    description: '游戏URL',
    example: 'https://example.com/game',
  })
  @Column()
  url?: string;

  @ApiProperty({
    description: '游戏Logo URL',
    example: 'https://example.com/logo.png',
  })
  logo_url?: string;

  @ApiProperty({
    description: '游戏Banner URL',
    example: 'https://example.com/banner.png',
  })
  @Column()
  banner_url?: string;

  @ApiProperty({
    description: '创建时间',
    example: '2021-01-01 12:00:00',
  })
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2021-01-01 12:00:00',
  })
  @UpdateDateColumn()
  updated_at!: Date;

  @ApiProperty({
    description: '游戏',
    example: {},
  })
  @ManyToOne(() => Game, (game: Game) => game.platformGames)
  @JoinColumn({ name: 'game_id' })
  game!: Game;

  @ApiProperty({
    description: '游戏排行榜',
    example: [],
  })
  @OneToMany(() => Ranking, (ranking: Ranking) => ranking.platformGame)
  rankings!: Ranking[];

  @ApiProperty({
    description: '游戏标签',
    example: [],
  })
  @ManyToMany(() => Tag, (tag) => tag.platformGames)
  @JoinTable({
    name: 'platform_game_tags',
    joinColumn: {
      name: 'platform_game_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id',
    },
  })
  tags!: Tag[];

  constructor(partial: Partial<PlatformGame> = {}) {
    Object.assign(this, partial);
  }
}
