import { PlatformGame } from '@/games/entities/platform-game.entity';
import { Tag } from '@/games/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('games')
export class Game {
  constructor(partial: Partial<Game> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: '游戏ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: '游戏标题',
    example: '塞尔达传说：荒野之息',
  })
  @Column({ unique: true })
  title!: string;

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
    description: '平台游戏列表',
    example: [],
  })
  @OneToMany(
    () => PlatformGame,
    (platformGame: PlatformGame) => platformGame.game,
  )
  platformGames!: PlatformGame[];

  @ApiProperty({
    description: '游戏标签',
    example: [],
  })
  @ManyToMany(() => Tag, (tag) => tag.games)
  tags!: Tag[];
}
