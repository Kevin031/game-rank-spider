import { Game } from '@/games/entities/game.entity';
import { PlatformGame } from '@/games/entities/platform-game.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @ApiProperty({
    description: '标签ID',
    example: 1016945,
  })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: '标签名称',
    example: '放置',
  })
  @Column()
  value!: string;

  @ApiProperty({
    description: '标签URI',
    example: 'taptap://taptap.com/library?tag=%E6%94%BE%E7%BD%AE',
  })
  @Column()
  uri!: string;

  @ApiProperty({
    description: '标签Web URL',
    example: '/tag/%E6%94%BE%E7%BD%AE',
  })
  @Column()
  web_url!: string;

  @ApiProperty({
    description: 'TapTap标签ID',
    example: 1016945,
  })
  @Column({ nullable: true })
  taptap_id?: number;

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
    description: '关联的游戏列表',
    example: [],
  })
  @ManyToMany(() => Game, (game) => game.tags)
  games!: Game[];

  @ApiProperty({
    description: '关联的平台游戏列表',
    example: [],
  })
  @ManyToMany(() => PlatformGame, (platformGame) => platformGame.tags)
  platformGames!: PlatformGame[];

  constructor(partial: Partial<Tag> = {}) {
    Object.assign(this, partial);
  }
}
