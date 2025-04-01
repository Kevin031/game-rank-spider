import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GameInfo } from '../models/game';
import { SpiderOptions, TapTapResponse, TapTapListItem } from '../types';

// 解析TapTap数据
function parseTapTapData(jsonData: string): GameInfo[] {
  const games: GameInfo[] = [];
  
  try {
    const data: TapTapResponse = JSON.parse(jsonData);
    
    for (let i = 0; i < data.data.list.length; i++) {
      const item = data.data.list[i];
      if (item.type === 'app' && item.app) {
        const app = item.app;
        const gameInfo = new GameInfo({
          taptap_id: app.id,
          source: 'taptap',
          title: app.title,
          description: app.description?.text || '',
          hits_total: app.stat?.hits_total || 0,
          logo_url: app.icon?.original_url || '',
          banner_url: app.banner?.original_url || '',
          url: `https://taptap.cn/app/${app.id}`,
          fans_count: app.stat?.fans_count || 0,
          hits_total_val: app.stat?.hits_total_val || 0,
          wish_count: app.stat?.wish_count || 0,
          tags: app.tags?.map(tag => ({
            id: tag.id,
            name: tag.value,
            uri: tag.uri
          })) || [],
          position: i + 1  // 添加位置信息
        });
        games.push(gameInfo);
      }
    }
  } catch (error) {
    console.error('解析TapTap数据时出错:', error);
  }

  return games;
}

// 从本地文件加载数据
async function loadFromFile(filePath: string): Promise<GameInfo[]> {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return parseTapTapData(jsonData);
  } catch (error) {
    console.error('从文件加载TapTap数据时出错:', error);
    return [];
  }
}

// 从TapTap API获取数据
async function fetchDataFromApi(page: number = 1, limit: number = 10): Promise<GameInfo[]> {
  try {
    // 计算起始位置
    const from = (page - 1) * limit + 1;
    
    // 构建UA参数
    const UA = 'V=1&PN=WebApp&LANG=zh_CN&VN_CODE=102&LOC=CN&PLT=PC&DS=Android&OS=Windows&OSV=10&DT=PC';
    
    // 构建URL
    const url = `https://www.taptap.cn/webapiv2/app-top/v2/hits?from=${from}&limit=${limit}&type_name=hot&X-UA=${encodeURIComponent(UA)}`;
    
    console.log(`正在请求TapTap API: ${url}`);
    
    // 使用axios发起网络请求
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.taptap.cn/top/hot',
        'Origin': 'https://www.taptap.cn'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // axios已经解析了JSON，所以我们需要重新序列化为字符串
    const jsonData = JSON.stringify(response.data);
    return parseTapTapData(jsonData);
  } catch (error) {
    console.error('从TapTap API获取数据时出错:', error);
    return [];
  }
}

// 爬取数据（支持从文件或API获取）
async function fetchData(options: SpiderOptions = {}): Promise<GameInfo[]> {
  const { mockFilePath, useApi = false, page = 1, limit = 10, pages = 1 } = options;
  
  // 如果使用本地模拟数据
  if (mockFilePath && !useApi) {
    return loadFromFile(mockFilePath);
  }
  
  // 使用API获取数据
  if (useApi) {
    // 如果需要获取多页数据
    if (pages > 1) {
      const allGames: GameInfo[] = [];
      
      // 依次获取每一页数据
      for (let i = 0; i < pages; i++) {
        const currentPage = page + i;
        console.log(`获取第${currentPage}页数据...`);
        
        const games = await fetchDataFromApi(currentPage, limit);
        allGames.push(...games);
        
        // 防止请求过快，添加延迟
        if (i < pages - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return allGames;
    }
    
    // 获取单页数据
    return fetchDataFromApi(page, limit);
  }
  
  // 默认返回空数组
  console.log('未指定数据源，返回空数据');
  return [];
}

export {
  parseTapTapData,
  loadFromFile,
  fetchDataFromApi,
  fetchData
}; 