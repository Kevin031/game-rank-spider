import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import {
  CreatePlatformGameDto,
  Platform,
} from './dto/create-platform-game.dto';
import { CreateRankingDto } from './dto/create-ranking.dto';
import { Game } from './entities/game.entity';
import { PlatformGame } from './entities/platform-game.entity';
import { Ranking } from './entities/ranking.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(PlatformGame)
    private platformGamesRepository: Repository<PlatformGame>,
    @InjectRepository(Ranking)
    private rankingsRepository: Repository<Ranking>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  // 创建游戏
  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    // 先查找是否存在相同标题的游戏
    const existingGame = await this.gamesRepository.findOne({
      where: { title: createGameDto.title },
    });

    if (existingGame) {
      // 如果存在，则更新游戏信息
      const updatedGame = this.gamesRepository.merge(
        existingGame,
        createGameDto,
      );
      return this.gamesRepository.save(updatedGame);
    } else {
      // 如果不存在，则创建新游戏
      const game = this.gamesRepository.create(createGameDto);
      return this.gamesRepository.save(game);
    }
  }

  // 创建平台游戏
  async createPlatformGame(
    gameId: number,
    createPlatformGameDto: CreatePlatformGameDto,
  ): Promise<PlatformGame> {
    const platformGame = this.platformGamesRepository.create({
      ...createPlatformGameDto,
      game: { id: gameId },
    });
    return this.platformGamesRepository.save(platformGame);
  }

  // 创建排行榜
  async createRanking(
    platformGameId: number,
    createRankingDto: CreateRankingDto,
  ): Promise<Ranking> {
    const ranking = this.rankingsRepository.create({
      ...createRankingDto,
      platformGame: { id: platformGameId },
    });
    return this.rankingsRepository.save(ranking);
  }

  // 获取游戏列表
  async getGames(options: { limit?: number; offset?: number }) {
    return this.gamesRepository.find({
      relations: ['platformGames'],
      take: options.limit,
      skip: options.offset,
    });
  }

  // 获取游戏详情
  async getGame(id: number) {
    return this.gamesRepository.findOne({
      where: { id },
      relations: ['platformGames'],
    });
  }

  // 获取排行榜
  async getRankings(options: {
    platform?: string;
    rankType?: string;
    date?: Date;
    limit?: number;
  }) {
    const query = this.rankingsRepository
      .createQueryBuilder('ranking')
      .leftJoinAndSelect('ranking.platformGame', 'platformGame')
      .leftJoinAndSelect('platformGame.game', 'game');

    if (options.platform) {
      query.andWhere('platformGame.platform = :platform', {
        platform: options.platform,
      });
    }

    if (options.rankType) {
      query.andWhere('ranking.rank_type = :rankType', {
        rankType: options.rankType,
      });
    }

    if (options.date) {
      query.andWhere('ranking.rank_date = :date', { date: options.date });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    query.orderBy('ranking.position', 'ASC');

    return query.getMany();
  }

  // 根据平台ID查找游戏
  async findGameByPlatformId(
    platformId: string,
    platform: Platform,
  ): Promise<Game | null> {
    const platformGame = await this.platformGamesRepository.findOne({
      where: {
        platform_id: platformId,
        platform: platform,
      },
      relations: ['game'],
    });
    return platformGame?.game || null;
  }

  // 录入游戏榜单数据
  async execGameRank(data: {
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
    rankDate: Date;
    position: number;
    fansCount: number;
    hitsTotal: number;
    hitsTotalVal: number;
    wishCount: number;
  }): Promise<{
    game: Game;
    platformGame: PlatformGame;
    ranking: Ranking;
  }> {
    // 1. 查找或创建统一游戏
    let game = await this.gamesRepository.findOne({
      where: { title: data.title },
    });

    if (!game) {
      game = await this.createGame({
        title: data.title,
        description: data.description,
        logo_url: data.logoUrl,
        banner_url: data.bannerUrl,
      });
    }

    // 2. 查找或创建平台游戏
    let platformGame = await this.platformGamesRepository.findOne({
      where: {
        platform_id: data.platformId,
        platform: data.platform,
      },
    });

    const platformGameUrl = `https://www.taptap.cn/app/${data.platformId}`;

    // 3. 处理标签数据
    let tags: Tag[] = [];
    if (data.tags && data.tags.length > 0) {
      // 查找或创建标签
      // 收集所有标签值，用于批量查询
      const tagValues = data.tags.map((tag) => tag.value);

      // 批量查询已存在的标签
      const existingTags = await this.tagsRepository.find({
        where: { value: In(tagValues) },
      });

      // 创建一个映射，用于快速查找已存在的标签
      const existingTagMap = new Map(
        existingTags.map((tag) => [tag.value, tag]),
      );

      // 处理每个标签数据
      tags = await Promise.all(
        data.tags.map(async (tagData) => {
          // 检查标签是否已存在
          let tag = existingTagMap.get(tagData.value);

          if (!tag) {
            // 如果标签不存在，创建新标签
            tag = this.tagsRepository.create({
              value: tagData.value,
              uri: tagData.uri,
              web_url: tagData.web_url,
              taptap_id: tagData.id, // 保留 taptap_id
            });
            tag = await this.tagsRepository.save(tag);
          }

          return tag;
        }),
      );
    }

    if (!platformGame) {
      platformGame = await this.createPlatformGame(game.id, {
        platform: data.platform,
        platform_id: data.platformId,
        description: data.description,
        logo_url: data.logoUrl,
        banner_url: data.bannerUrl,
        url: platformGameUrl,
        tags: tags,
      });
    } else {
      // 更新平台游戏信息
      platformGame = this.platformGamesRepository.merge(platformGame, {
        description: data.description,
        logo_url: data.logoUrl,
        banner_url: data.bannerUrl,
        url: platformGameUrl,
        tags: tags,
      });
      platformGame = await this.platformGamesRepository.save(platformGame);
    }

    // 4. 创建排行榜数据
    const ranking = await this.createRanking(platformGame.id, {
      rank_type: data.rankType,
      rank_date: data.rankDate,
      position: data.position,
      fans_count: data.fansCount,
      hits_total: data.hitsTotal,
      hits_total_val: data.hitsTotalVal,
      wish_count: data.wishCount,
    });

    return {
      game,
      platformGame,
      ranking,
    };
  }
}
