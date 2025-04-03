import fs from "fs";
import { DATA_DIR, getDataFilePath } from "../config/paths";
import { initDatabase } from "../db/database";
import { saveGameToDb } from "../models/game";
import { fetchData } from "../spiders/taptap-spider";
import { RankInfo } from "../types";

/**
 * 爬取TapTap热门榜数据并按天保存
 */
async function crawlTapTapRanking() {
  try {
    console.log("开始爬取TapTap热门榜数据...");

    // 获取当前日期
    const today = new Date().toISOString().split("T")[0]; // 格式: YYYY-MM-DD

    // 使用API爬取数据
    const games = await fetchData({
      useApi: true,
      limit: 10, // 每页10条
      pages: 2, // 爬取2页，共20条
    });

    console.log(`成功获取 ${games.length} 条游戏数据`);

    // 确保目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 保存到文件 - 以日期命名
    const outputFile = getDataFilePath(`taptap-hot-${today}.json`);
    fs.writeFileSync(
      outputFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          date: today,
          rank_type: "hot",
          total: games.length,
          games: games.map((game) => game.toJSON()),
        },
        null,
        2
      )
    );

    console.log(`原始数据已保存至: ${outputFile}`);

    // 初始化数据库
    console.log("正在初始化数据库...");
    const db = await initDatabase();

    // 定义排行榜信息
    const rankInfo: RankInfo = {
      date: today,
      type: "hot",
    };

    // 将游戏数据保存到数据库
    console.log("正在保存游戏数据到数据库...");
    for (const game of games) {
      try {
        const gameId = await saveGameToDb(db, game, rankInfo);
        console.log(
          `已保存: ${game.title} (ID: ${gameId}, 排名: ${game.position})`
        );
      } catch (error) {
        console.error(`保存游戏数据失败: ${game.title}`, error);
      }
    }

    // 关闭数据库连接
    console.log("正在关闭数据库连接...");
    await new Promise<void>((resolve) => {
      db.close(() => {
        console.log("数据库连接已关闭");
        resolve();
      });
    });

    // 输出简要信息
    console.log(`\n${today} TapTap热门榜前${games.length}名游戏已保存到数据库`);
    games.forEach((game, index) => {
      console.log(
        `${game.position}. ${game.title} (ID: ${game.taptap_id}) - 粉丝数: ${game.fans_count}`
      );
    });
  } catch (error) {
    console.error("爬取过程中出错:", error);
  }
}

// 执行爬虫
crawlTapTapRanking();
