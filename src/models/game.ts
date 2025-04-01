import { Database } from 'sqlite3';
import { GameInfoParams, Tag, SpiderSource, RankInfo } from '../types';

// 定义标准的游戏数据结构
export class GameInfo {
  // 游戏唯一标识符
  id: number | null;
  // TapTap平台的游戏ID
  taptap_id: number | string | null;
  // Steam平台的游戏ID
  steam_id: number | string | null;
  // 数据来源平台
  source: SpiderSource;
  // 游戏标题
  title: string;
  // 游戏描述
  description: string;
  // 总点击量/热度
  hits_total: number;
  // 游戏logo图片URL
  logo_url: string;
  // 游戏横幅图片URL
  banner_url: string;
  // 游戏标签列表
  tags: Tag[];
  // 游戏详情页URL
  url: string;
  // 粉丝数量
  fans_count: number;
  // 热度值(数值形式)
  hits_total_val: number;
  // 愿望单数量
  wish_count: number;
  position?: number; // 排行榜位置

  constructor({
    id = null,
    taptap_id = null,
    steam_id = null,
    source,
    title,
    description = '',
    hits_total = 0,
    logo_url = '',
    banner_url = '',
    tags = [],
    fans_count = 0,
    hits_total_val = 0,
    wish_count = 0,
    url = '',
    position
  }: GameInfoParams) {
    this.id = id;
    this.taptap_id = taptap_id;
    this.steam_id = steam_id;
    this.source = source;
    this.title = title;
    this.description = description;
    this.hits_total = hits_total;
    this.logo_url = logo_url;
    this.banner_url = banner_url;
    this.tags = tags;
    this.url = url;
    this.fans_count = fans_count;
    this.hits_total_val = hits_total_val;
    this.wish_count = wish_count;
    this.position = position;
  }

  toJSON(): GameInfoParams {
    return {
      id: this.id,
      taptap_id: this.taptap_id,
      steam_id: this.steam_id,
      source: this.source,
      title: this.title,
      description: this.description,
      hits_total: this.hits_total,
      logo_url: this.logo_url,
      banner_url: this.banner_url,
      tags: this.tags,
      url: this.url,
      fans_count: this.fans_count,
      hits_total_val: this.hits_total_val,
      wish_count: this.wish_count,
      position: this.position
    };
  }
}

// 保存游戏数据到数据库，包括排行榜信息
export async function saveGameToDb(
  db: Database, 
  game: GameInfo, 
  rankInfo: RankInfo = { date: new Date().toISOString().split('T')[0], type: 'hot' }
): Promise<number> {
  return new Promise((resolve, reject) => {
    // 根据来源选择合适的ID字段进行查询
    let idField = '';
    let idValue: string | number | null = null;
    
    if (game.source === 'taptap' && game.taptap_id) {
      idField = 'taptap_id';
      idValue = game.taptap_id;
    } else if (game.source === 'steam' && game.steam_id) {
      idField = 'steam_id';
      idValue = game.steam_id;
    } else {
      reject(new Error('无效的游戏数据来源或ID'));
      return;
    }
    
    // 先查询是否存在
    db.get(`SELECT id FROM games WHERE ${idField} = ?`, [idValue], async (err, row: { id: number } | undefined) => {
      if (err) {
        reject(err);
        return;
      }

      let gameId: number;
      if (row) {
        // 更新现有游戏基本信息
        await new Promise<void>((resolve, reject) => {
          db.run(
            `UPDATE games 
             SET title = ?, description = ?, 
                 logo_url = ?, banner_url = ?, url = ?, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE ${idField} = ?`,
            [game.title, game.description, 
             game.logo_url, game.banner_url, game.url, 
             idValue],
            (err) => err ? reject(err) : resolve()
          );
        });
        gameId = row.id;
      } else {
        // 构建插入语句 - 只插入基本信息
        const fields = ['source', 'title', 'description', 
                      'logo_url', 'banner_url', 'url'];
        const values = [game.source, game.title, game.description,
                      game.logo_url, game.banner_url, game.url];
        
        // 添加来源特定的ID字段
        if (game.source === 'taptap' && game.taptap_id) {
          fields.push('taptap_id');
          values.push(String(game.taptap_id));
        } else if (game.source === 'steam' && game.steam_id) {
          fields.push('steam_id');
          values.push(String(game.steam_id));
        }
        
        // 插入新记录
        const result = await new Promise<number>((resolve, reject) => {
          const placeholders = values.map(() => '?').join(', ');
          db.run(
            `INSERT INTO games (${fields.join(', ')}) VALUES (${placeholders})`,
            values,
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        gameId = result;
      }

      // 保存排行榜数据
      const position = game.position || 0;
      
      // 检查是否已存在此日期的排名数据
      const existingRank = await new Promise<boolean>((resolve, reject) => {
        db.get(
          `SELECT id FROM rankings WHERE game_id = ? AND rank_date = ? AND rank_type = ?`,
          [gameId, rankInfo.date, rankInfo.type],
          (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
          }
        );
      });
      
      if (existingRank) {
        // 更新排名数据
        await new Promise<void>((resolve, reject) => {
          db.run(
            `UPDATE rankings 
             SET position = ?, fans_count = ?, hits_total = ?, 
                 hits_total_val = ?, wish_count = ?
             WHERE game_id = ? AND rank_date = ? AND rank_type = ?`,
            [
              position, game.fans_count, game.hits_total, 
              game.hits_total_val, game.wish_count,
              gameId, rankInfo.date, rankInfo.type
            ],
            (err) => err ? reject(err) : resolve()
          );
        });
      } else {
        // 插入新排名数据
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT INTO rankings 
             (game_id, rank_date, rank_type, position, fans_count, hits_total, hits_total_val, wish_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              gameId, rankInfo.date, rankInfo.type, position,
              game.fans_count, game.hits_total, game.hits_total_val, game.wish_count
            ],
            (err) => err ? reject(err) : resolve()
          );
        });
      }

      // 保存标签
      if (game.tags && game.tags.length > 0) {
        // 删除旧的关联关系
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM game_tags WHERE game_id = ?', [gameId], 
            (err) => err ? reject(err) : resolve()
          );
        });

        for (const tag of game.tags) {
          // 为标签添加来源信息
          tag.source = game.source;
          
          // 构建标签插入语句
          const tagFields = ['source', 'name', 'uri'];
          const tagValues = [tag.source, tag.name, tag.uri || ''];
          
          // 添加来源特定的ID字段
          let tagIdField = '';
          if (game.source === 'taptap') {
            tagFields.push('taptap_id');
            tagValues.push(String(tag.id));
            tagIdField = 'taptap_id';
          } else if (game.source === 'steam') {
            tagFields.push('steam_id');
            tagValues.push(String(tag.id));
            tagIdField = 'steam_id';
          }
          
          // 插入或更新标签
          await new Promise<void>((resolve, reject) => {
            const tagPlaceholders = tagValues.map(() => '?').join(', ');
            db.run(
              `INSERT INTO tags (${tagFields.join(', ')}) 
               VALUES (${tagPlaceholders})
               ON CONFLICT(${tagIdField}) DO UPDATE SET 
               name = excluded.name, 
               uri = excluded.uri`,
              tagValues,
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          // 获取标签ID
          const tagRow = await new Promise<{ id: number }>((resolve, reject) => {
            db.get(`SELECT id FROM tags WHERE ${tagIdField} = ? AND source = ?`, 
              [String(tag.id), tag.source],
              (err, row: { id: number } | undefined) => {
                if (err) reject(err);
                else if (row) resolve(row);
                else reject(new Error(`找不到标签: ${tag.id}`));
              }
            );
          });

          // 建立游戏和标签的关联
          await new Promise<void>((resolve, reject) => {
            db.run(
              `INSERT OR REPLACE INTO game_tags (game_id, tag_id) VALUES (?, ?)`,
              [gameId, tagRow.id],
              (err) => err ? reject(err) : resolve()
            );
          });
        }
      }
      resolve(gameId);
    });
  });
} 