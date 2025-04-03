import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateGameDto } from './dto/create-game.dto';
import {
  CreatePlatformGameDto,
  Platform,
} from './dto/create-platform-game.dto';
import { CreateRankingDto } from './dto/create-ranking.dto';
import { GamesService } from './games.service';

@ApiTags('游戏')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  async createGame(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.createGame(createGameDto);
  }

  @Post(':id/platform-games')
  async createPlatformGame(
    @Param('id') id: string,
    @Body() createPlatformGameDto: CreatePlatformGameDto,
  ) {
    return this.gamesService.createPlatformGame(
      Number(id),
      createPlatformGameDto,
    );
  }

  @Post('platform-games/:id/rankings')
  async createRanking(
    @Param('id') id: string,
    @Body() createRankingDto: CreateRankingDto,
  ) {
    return this.gamesService.createRanking(Number(id), createRankingDto);
  }

  @Get()
  async getGames(@Query() query: { limit?: number; offset?: number }) {
    return this.gamesService.getGames(query);
  }

  @Get(':id')
  async getGame(@Param('id') id: string) {
    return this.gamesService.getGame(Number(id));
  }

  @Get('rankings')
  async getRankings(
    @Query()
    query: {
      platform?: string;
      rankType?: string;
      date?: string;
      limit?: number;
    },
  ) {
    return this.gamesService.getRankings({
      ...query,
      date: query.date ? new Date(query.date) : undefined,
    });
  }

  @Get('find-by-platform')
  async findGameByPlatform(
    @Query('platformId') platformId: string,
    @Query('platform') platform: string,
  ) {
    if (platform !== 'taptap' && platform !== 'steam') {
      throw new Error('Invalid platform');
    }
    return this.gamesService.findGameByPlatformId(
      platformId,
      platform as Platform,
    );
  }

  /**
   * 录入游戏榜单数据
   */
  @Post('exec-game-rank')
  async execGameRank(
    @Body()
    data: {
      platform: Platform;
      platformId: string;
      title: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      tags?: Array<{
        id: number;
        value: string;
        uri: string;
        web_url: string;
      }>;
      rankType: string;
      rankDate: string;
      position: number;
      fansCount: number;
      hitsTotal: number;
      hitsTotalVal: number;
      wishCount: number;
    },
  ) {
    return this.gamesService.execGameRank({
      ...data,
      rankDate: new Date(data.rankDate),
    });
  }
}
