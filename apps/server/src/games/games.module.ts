import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { PlatformGame } from './entities/platform-game.entity';
import { Ranking } from './entities/ranking.entity';
import { Tag } from './entities/tag.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, PlatformGame, Ranking, Tag])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
