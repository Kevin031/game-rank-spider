import axios from 'axios'
import fs from 'fs'
import { GameInfo } from '../models/game'
import { SpiderOptions, TapTapResponse } from '../types'

// 添加常量配置
const CONFIG = {
  BASE_URL: 'https://www.taptap.cn',
  API_PATH: '/webapiv2/app-top/v2/hits',
  DEFAULT_DELAY: 1000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 2000,
  DEFAULT_UA:
    'V=1&PN=WebApp&LANG=zh_CN&VN_CODE=102&LOC=CN&PLT=PC&DS=Android&OS=Windows&OSV=10&DT=PC',
}

// 添加请求头生成函数
function generateHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    Referer: `${CONFIG.BASE_URL}/top/hot`,
    Origin: CONFIG.BASE_URL,
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  }
}

// 添加延迟函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 添加重试机制的请求函数
async function fetchWithRetry(url: string, retryTimes = CONFIG.RETRY_TIMES): Promise<any> {
  for (let i = 0; i < retryTimes; i++) {
    try {
      const response = await axios.get(url, {
        headers: generateHeaders(),
        timeout: 10000, // 10秒超时
      })
      return response
    } catch (error) {
      if (i === retryTimes - 1) throw error
      console.log(`请求失败，${i + 1}秒后重试...`)
      await sleep(CONFIG.RETRY_DELAY)
    }
  }
}

async function execGameRankData(apps: GameInfo[]) {
  // 获取当前日期作为排名日期
  const today = new Date().toISOString().split('T')[0] // 格式: YYYY-MM-DD
  // 构建排名数据结构
  for (const app of apps) {
    const rankData = {
      platform: 'taptap',
      platformId: app.taptap_id?.toString() || '',
      title: app.title,
      description: app.description || '',
      logoUrl: app.logo_url || '',
      bannerUrl: app.banner_url || '',
      tags:
        app.tags?.map(tag => ({
          id: tag.id,
          value: tag.name,
          uri: tag.uri,
          web_url: tag.uri,
        })) || [],
      rankType: 'hot',
      rankDate: today,
      position: app.position,
      fansCount: app.fans_count || 0,
      hitsTotal: app.hits_total || 0,
      hitsTotalVal: app.hits_total_val || 0,
      wishCount: app.wish_count || 0,
    }
    try {
      // 调用排名API
      await axios.post('http://10.18.20.58:4125/api/games/exec-game-rank', rankData)
      console.log(`成功提交排名数据: ${app.title} (ID: ${app.taptap_id})`)
    } catch (error) {
      console.error(`提交排名数据失败: ${app.title}`, error)
    }
  }
}

// 解析TapTap数据
function parseTapTapData(jsonData: string, startIndex: number): GameInfo[] {
  const games: GameInfo[] = []

  try {
    const data: TapTapResponse = JSON.parse(jsonData)

    for (let i = 0; i < data.data.list.length; i++) {
      const item = data.data.list[i]
      if (item.type === 'app' && item.app) {
        const app = item.app
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
          tags:
            app.tags?.map(tag => ({
              id: tag.id,
              name: tag.value,
              uri: tag.uri,
            })) || [],
          position: startIndex + i + 1, // 排名信息，需要考虑页码
        })
        games.push(gameInfo)
      }
    }
  } catch (error) {
    console.error('解析TapTap数据时出错:', error)
  }

  return games
}

// 从本地文件加载数据
async function loadFromFile(filePath: string): Promise<GameInfo[]> {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8')
    return parseTapTapData(jsonData, 0)
  } catch (error) {
    console.error('从文件加载TapTap数据时出错:', error)
    return []
  }
}

// 优化 fetchDataFromApi 函数
async function fetchDataFromApi(page: number = 1, limit: number = 10): Promise<GameInfo[]> {
  try {
    const from = (page - 1) * limit + 1
    const url = `${CONFIG.BASE_URL}${
      CONFIG.API_PATH
    }?from=${from}&limit=${limit}&type_name=hot&X-UA=${encodeURIComponent(CONFIG.DEFAULT_UA)}`

    console.log(`正在请求TapTap API: ${url}`)

    const response = await fetchWithRetry(url)

    if (response.status !== 200) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    const jsonData = JSON.stringify(response.data)
    let result = parseTapTapData(jsonData, (page - 1) * limit)
    // execGameRankData(result)
    return result
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('从TapTap API获取数据时出错:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
      })
    } else {
      console.error('从TapTap API获取数据时出错:', error)
    }
    return []
  }
}

// 优化 fetchData 函数
async function fetchData(options: SpiderOptions = {}): Promise<GameInfo[]> {
  const { mockFilePath, useApi = false, page = 1, limit = 10, pages = 1 } = options

  if (mockFilePath && !useApi) {
    return loadFromFile(mockFilePath)
  }

  if (!useApi) {
    console.log('未指定数据源，返回空数据')
    return []
  }

  if (pages <= 1) {
    return fetchDataFromApi(page, limit)
  }

  const allGames: GameInfo[] = []
  for (let i = 0; i < pages; i++) {
    const currentPage = page + i
    console.log(`获取第${currentPage}页数据...`)

    const games = await fetchDataFromApi(currentPage, limit)
    allGames.push(...games)

    if (i < pages - 1) {
      await sleep(CONFIG.DEFAULT_DELAY)
    }
  }

  return allGames
}

export { fetchData, fetchDataFromApi, loadFromFile, parseTapTapData }
