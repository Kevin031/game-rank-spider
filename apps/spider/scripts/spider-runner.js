const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// 定义标准的游戏数据结构
class GameInfo {
  constructor({
    id,
    title,
    description,
    hits_total,
    logo_url,
    banner_url,
    tags,
    fans_count,
    hits_total_val,
    wish_count,
  }) {
    this.taptap_id = id;
    this.title = title;
    this.description = description;
    this.hits_total = hits_total;
    this.logo_url = logo_url;
    this.banner_url = banner_url;
    this.tags = tags;
    this.url = `https://taptap.cn/app/${id}`;
    this.fans_count = fans_count;
    this.hits_total_val = hits_total_val;
    this.wish_count = wish_count;
  }

  toJSON() {
    return {
      taptap_id: this.taptap_id,
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
    };
  }
}

// 解析TapTap数据
function parseTapTapData(jsonData) {
  const games = [];

  try {
    const data = JSON.parse(jsonData);

    for (const item of data.data.list) {
      if (item.type === "app" && item.app) {
        const app = item.app;
        const gameInfo = new GameInfo({
          id: app.id,
          title: app.title,
          description: app.description?.text || "",
          hits_total: app.stat?.hits_total || 0,
          logo_url: app.icon?.original_url || "",
          banner_url: app.banner?.original_url || "",
          tags:
            app.tags?.map((tag) => ({
              id: tag.id,
              name: tag.value,
              uri: tag.uri,
            })) || [],
          fans_count: app.stat?.fans_count || 0,
          hits_total_val: app.stat?.hits_total_val || 0,
          wish_count: app.stat?.wish_count || 0,
        });
        games.push(gameInfo);
      }
    }
  } catch (error) {
    console.error("解析数据时出错:", error);
  }

  return games;
}

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, "../../../data/taptap.db");
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // 创建games表
      db.run(
        `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taptap_id INTEGER UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        hits_total INTEGER,
        logo_url TEXT,
        banner_url TEXT,
        url TEXT,
        fans_count INTEGER DEFAULT 0,
        hits_total_val INTEGER DEFAULT 0,
        wish_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                },
              );
            },
          );
        },
      );
    });
  });
}

// 保存游戏数据到数据库
async function saveGameToDb(db, game) {
  return new Promise((resolve, reject) => {
    // 先查询是否存在
    db.get(
      "SELECT id FROM games WHERE taptap_id = ?",
      [game.taptap_id],
      async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        let gameId;
        if (row) {
          // 更新现有记录
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE games 
             SET title = ?, description = ?, hits_total = ?, 
                 logo_url = ?, banner_url = ?, url = ?, 
                 fans_count = ?, hits_total_val = ?, wish_count = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE taptap_id = ?`,
              [
                game.title,
                game.description,
                game.hits_total,
                game.logo_url,
                game.banner_url,
                game.url,
                game.fans_count,
                game.hits_total_val,
                game.wish_count,
                game.taptap_id,
              ],
              (err) => (err ? reject(err) : resolve()),
            );
          });
          gameId = row.id;
        } else {
          // 插入新记录
          const result = await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO games (taptap_id, title, description, hits_total, 
                              logo_url, banner_url, url, 
                              fans_count, hits_total_val, wish_count) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                game.taptap_id,
                game.title,
                game.description,
                game.hits_total,
                game.logo_url,
                game.banner_url,
                game.url,
                game.fans_count,
                game.hits_total_val,
                game.wish_count,
              ],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              },
            );
          });
          gameId = result;
        }

        // 保存标签
        if (game.tags && game.tags.length > 0) {
          // 删除旧的关联关系
          await new Promise((resolve, reject) => {
            db.run(
              "DELETE FROM game_tags WHERE game_id = ?",
              [gameId],
              (err) => (err ? reject(err) : resolve()),
            );
          });

          for (const tag of game.tags) {
            // 插入或更新标签
            const tagResult = await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO tags (taptap_id, name, uri) 
               VALUES (?, ?, ?)
               ON CONFLICT(taptap_id) DO UPDATE SET 
               name = excluded.name, 
               uri = excluded.uri`,
                [tag.id, tag.name, tag.uri],
                function (err) {
                  if (err) reject(err);
                  else resolve(this.lastID);
                },
              );
            });

            // 获取标签ID
            const tagRow = await new Promise((resolve, reject) => {
              db.get(
                "SELECT id FROM tags WHERE taptap_id = ?",
                [tag.id],
                (err, row) => (err ? reject(err) : resolve(row)),
              );
            });

            // 建立游戏和标签的关联
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT OR REPLACE INTO game_tags (game_id, tag_id) VALUES (?, ?)`,
                [gameId, tagRow.id],
                (err) => (err ? reject(err) : resolve()),
              );
            });
          }
        }
        resolve();
      },
    );
  });
}

// 查询保存的游戏数据
async function queryGames(db) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT g.*, GROUP_CONCAT(t.name) as tag_names
      FROM games g
      LEFT JOIN game_tags gt ON g.id = gt.game_id
      LEFT JOIN tags t ON gt.tag_id = t.id
      GROUP BY g.id
    `,
      [],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      },
    );
  });
}

// 主函数
async function main() {
  try {
    const jsonPath = path.join(__dirname, "../mock/taptap-rank.json");
    const jsonData = fs.readFileSync(jsonPath, "utf8");
    const games = parseTapTapData(jsonData);

    console.log(`解析到 ${games.length} 个游戏数据，开始保存到数据库...`);

    const db = await initDatabase();

    // 开启事务
    await new Promise((resolve, reject) => {
      db.run("BEGIN TRANSACTION", (err) => (err ? reject(err) : resolve()));
    });

    try {
      for (const game of games) {
        await saveGameToDb(db, game);
      }

      // 提交事务
      await new Promise((resolve, reject) => {
        db.run("COMMIT", (err) => (err ? reject(err) : resolve()));
      });

      // 查询并显示保存的数据
      const savedGames = await queryGames(db);
      console.log("保存的游戏数据：");
      console.log(JSON.stringify(savedGames, null, 2));
      console.log("数据保存成功！");
    } catch (error) {
      // 发生错误时回滚事务
      await new Promise((resolve) => {
        db.run("ROLLBACK", () => resolve());
      });
      throw error;
    } finally {
      // 关闭数据库连接
      db.close();
    }
  } catch (error) {
    console.error("发生错误:", error);
  }
}

main();
