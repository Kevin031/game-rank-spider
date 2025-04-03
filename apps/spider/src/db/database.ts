import fs from "fs";
import sqlite3, { Database } from "sqlite3";
import { DATA_DIR, DB_PATH } from "../config/paths";
import { GameRecord, QueryOptions, SpiderSource } from "../types";

// 初始化数据库
export async function initDatabase(): Promise<Database> {
  return new Promise((resolve, reject) => {
    // 确保data目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // 创建games表 - 存储游戏基本信息
      db.run(
        `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taptap_id INTEGER UNIQUE,
        steam_id INTEGER UNIQUE,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // 创建rankings表 - 存储每日榜单数据
          db.run(
            `CREATE TABLE IF NOT EXISTS rankings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_id INTEGER NOT NULL,
          rank_date DATE NOT NULL,
          rank_type TEXT NOT NULL,
          position INTEGER NOT NULL,
          fans_count INTEGER DEFAULT 0,
          hits_total INTEGER DEFAULT 0,
          hits_total_val INTEGER DEFAULT 0,
          wish_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (game_id) REFERENCES games(id),
          UNIQUE(game_id, rank_date, rank_type)
        )`,
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              // 创建tags表
              db.run(
                `CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            taptap_id INTEGER UNIQUE,
            steam_id INTEGER UNIQUE,
            source TEXT NOT NULL,
            name TEXT NOT NULL,
            uri TEXT
          )`,
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  // 创建game_tags关联表
                  db.run(
                    `CREATE TABLE IF NOT EXISTS game_tags (
              game_id INTEGER,
              tag_id INTEGER,
              PRIMARY KEY (game_id, tag_id),
              FOREIGN KEY (game_id) REFERENCES games(id),
              FOREIGN KEY (tag_id) REFERENCES tags(id)
            )`,
                    (err) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      resolve(db);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
}

// 查询保存的游戏数据
export async function queryGames(
  db: Database,
  options: QueryOptions = {}
): Promise<GameRecord[]> {
  const { source, limit = 100, offset = 0, date, rankType = "hot" } = options;

  let query;
  const params: Array<any> = [];

  if (date) {
    // 查询特定日期的榜单数据
    query = `
      SELECT g.id, g.taptap_id, g.steam_id, g.source, g.title, g.description, 
             g.logo_url, g.banner_url, g.url, 
             r.fans_count, r.hits_total, r.hits_total_val, r.wish_count, 
             r.position as rank_position, r.rank_date,
             GROUP_CONCAT(t.name) as tag_names
      FROM games g
      JOIN rankings r ON g.id = r.game_id
      LEFT JOIN game_tags gt ON g.id = gt.game_id
      LEFT JOIN tags t ON gt.tag_id = t.id
      WHERE r.rank_date = ? AND r.rank_type = ?
    `;
    params.push(date, rankType);

    if (source) {
      query += ` AND g.source = ?`;
      params.push(source);
    }

    query += ` GROUP BY g.id ORDER BY r.position ASC LIMIT ? OFFSET ?`;
  } else {
    // 查询最新的游戏数据（不关联榜单）
    query = `
      SELECT g.*, GROUP_CONCAT(t.name) as tag_names
      FROM games g
      LEFT JOIN game_tags gt ON g.id = gt.game_id
      LEFT JOIN tags t ON gt.tag_id = t.id
    `;

    if (source) {
      query += ` WHERE g.source = ?`;
      params.push(source);
    }

    query += ` GROUP BY g.id LIMIT ? OFFSET ?`;
  }

  params.push(limit, offset);

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows: GameRecord[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 获取可用的榜单日期列表
export async function getRankDates(
  db: Database,
  options: { source?: SpiderSource; rankType?: string } = {}
): Promise<string[]> {
  const { source, rankType = "hot" } = options;

  let query = `SELECT DISTINCT rank_date FROM rankings WHERE rank_type = ?`;
  const params: any[] = [rankType];

  if (source) {
    query += ` AND game_id IN (SELECT id FROM games WHERE source = ?)`;
    params.push(source);
  }

  query += ` ORDER BY rank_date DESC`;

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows: { rank_date: string }[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map((row) => row.rank_date));
    });
  });
}
