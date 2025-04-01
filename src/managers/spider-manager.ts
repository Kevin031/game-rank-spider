import { Database } from 'sqlite3';
import { saveGameToDb } from '../models/game';
import { initDatabase, queryGames } from '../db/database';
import * as taptapSpider from '../spiders/taptap-spider';
import * as steamSpider from '../spiders/steam-spider';
import { SpiderSource, SpiderOptions, SpiderTask, TaskResult, GameRecord, QueryOptions } from '../types';

type Spider = {
  fetchData: (options?: SpiderOptions) => Promise<any[]>;
};

type Spiders = {
  [key in SpiderSource]: Spider;
};

class SpiderManager {
  private db: Database | null;
  private spiders: Spiders;

  constructor() {
    this.db = null;
    this.spiders = {
      taptap: taptapSpider,
      steam: steamSpider
    };
  }

  // 初始化
  async initialize(): Promise<boolean> {
    try {
      this.db = await initDatabase();
      console.log('数据库初始化成功');
      return true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      return false;
    }
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close(() => {
          console.log('数据库连接已关闭');
          this.db = null;
          resolve();
        });
      });
    }
  }

  // 执行单个爬虫任务
  async runTask(source: SpiderSource, options: SpiderOptions = {}): Promise<TaskResult> {
    if (!this.db) {
      console.error('数据库未初始化');
      return { success: false, error: '数据库未初始化' };
    }

    const spider = this.spiders[source];
    if (!spider) {
      console.error(`未找到 ${source} 爬虫`);
      return { success: false, error: `未找到 ${source} 爬虫` };
    }

    try {
      console.log(`开始执行 ${source} 爬虫任务...`);
      
      // 开启事务
      await new Promise<void>((resolve, reject) => {
        this.db!.run('BEGIN TRANSACTION', (err) => err ? reject(err) : resolve());
      });

      try {
        // 获取数据
        const games = await spider.fetchData(options);
        console.log(`${source} 爬虫获取到 ${games.length} 个游戏数据`);

        // 保存数据
        const savedIds: number[] = [];
        for (const game of games) {
          const id = await saveGameToDb(this.db, game);
          savedIds.push(id);
        }

        // 提交事务
        await new Promise<void>((resolve, reject) => {
          this.db!.run('COMMIT', (err) => err ? reject(err) : resolve());
        });

        console.log(`${source} 爬虫任务完成，保存了 ${savedIds.length} 个游戏数据`);
        return { 
          success: true, 
          count: savedIds.length,
          savedIds: savedIds 
        };
      } catch (error) {
        // 回滚事务
        await new Promise<void>((resolve) => {
          this.db!.run('ROLLBACK', () => resolve());
        });
        throw error;
      }
    } catch (error: any) {
      console.error(`${source} 爬虫任务执行失败:`, error);
      return { 
        success: false, 
        error: error.message || '未知错误' 
      };
    }
  }

  // 批量执行爬虫任务
  async runTasks(tasks: SpiderTask[]): Promise<Record<SpiderSource, TaskResult>> {
    if (!this.db) {
      await this.initialize();
    }

    const results: Record<SpiderSource, TaskResult> = {} as Record<SpiderSource, TaskResult>;
    for (const task of tasks) {
      const { source, options } = task;
      results[source] = await this.runTask(source, options);
    }

    return results;
  }

  // 查询游戏数据
  async queryGames(options: QueryOptions = {}): Promise<GameRecord[]> {
    if (!this.db) {
      console.error('数据库未初始化');
      return [];
    }

    try {
      return await queryGames(this.db, options);
    } catch (error) {
      console.error('查询游戏数据失败:', error);
      return [];
    }
  }
}

export default SpiderManager; 