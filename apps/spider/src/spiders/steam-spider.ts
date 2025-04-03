import fs from "fs";
import { GameInfo } from "../models/game";
import { SpiderOptions, SteamResponse } from "../types";

// 解析Steam数据
function parseSteamData(jsonData: string): GameInfo[] {
  const games: GameInfo[] = [];

  try {
    const data: SteamResponse = JSON.parse(jsonData);
    // 这里是Steam数据的解析逻辑，具体结构需要根据实际Steam API返回调整
    // 这里仅作为示例
    if (data.applist && data.applist.apps) {
      for (const app of data.applist.apps) {
        const gameInfo = new GameInfo({
          steam_id: app.appid,
          source: "steam",
          title: app.name,
          description: app.detailed_description || "",
          hits_total: app.owners || 0,
          logo_url: app.header_image || "",
          banner_url: app.background || "",
          url: `https://store.steampowered.com/app/${app.appid}`,
          // Steam可能有不同的统计字段，这里只是示例
          fans_count: app.followers || 0,
          hits_total_val: app.player_count || 0,
          wish_count: app.wishlist_count || 0,
          tags:
            app.genres?.map((genre) => ({
              id: genre.id,
              name: genre.description,
              uri: `/tags/${genre.id}`,
            })) || [],
        });
        games.push(gameInfo);
      }
    }
  } catch (error) {
    console.error("解析Steam数据时出错:", error);
  }

  return games;
}

// 从本地文件加载数据
async function loadFromFile(filePath: string): Promise<GameInfo[]> {
  try {
    const jsonData = fs.readFileSync(filePath, "utf8");
    return parseSteamData(jsonData);
  } catch (error) {
    console.error("从文件加载Steam数据时出错:", error);
    return [];
  }
}

// 爬取数据（这里模拟从API获取数据）
async function fetchData(options: SpiderOptions = {}): Promise<GameInfo[]> {
  const { mockFilePath } = options;
  if (mockFilePath) {
    return loadFromFile(mockFilePath);
  }

  // TODO: 这里可以添加实际的Steam API请求代码
  console.log("使用实际API获取Steam数据的功能尚未实现");
  return [];
}

export { fetchData, loadFromFile, parseSteamData };
