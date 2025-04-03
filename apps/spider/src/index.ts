import * as fs from 'fs'
import cron from 'node-cron'
import * as path from 'path'
import SpiderManager from './managers/spider-manager'
import { SpiderTask } from './types'

// 创建日志目录
const LOG_DIR = path.join(__dirname, '../logs')
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// 清理过期日志文件（保留最近30天）
function cleanupOldLogs(): void {
  try {
    const files = fs.readdirSync(LOG_DIR)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file)
      const stats = fs.statSync(filePath)

      // 如果是日志文件且创建时间超过30天
      if (file.endsWith('.log') && stats.birthtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath)
        console.log(`删除过期日志: ${file}`)
      }
    })
  } catch (error) {
    console.error(`清理过期日志失败: ${error}`)
  }
}

// 获取当前日期，格式：YYYY-MM-DD
function getToday(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取当前时间，格式：YYYY-MM-DD HH:MM:SS
function getNow(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 日志记录函数
function log(message: string, level: 'info' | 'error' = 'info'): void {
  const now = getNow()
  const today = getToday()
  const logFileName = `${today}.log`
  const logFilePath = path.join(LOG_DIR, logFileName)

  const logMessage = `[${now}] [${level.toUpperCase()}] ${message}\n`

  // 控制台输出
  if (level === 'info') {
    console.log(message)
  } else {
    console.error(message)
  }

  // 写入日志文件
  fs.appendFileSync(logFilePath, logMessage)
}

// 检查当天是否已有数据
async function checkTodayData(manager: SpiderManager): Promise<boolean> {
  try {
    const today = getToday()
    const games = await manager.queryGames({ date: today })
    return games.length > 0
  } catch (error) {
    log(`检查当天数据失败: ${error}`, 'error')
    return false
  }
}

// 执行抓取任务
async function runSpiderTasks(manager: SpiderManager): Promise<void> {
  try {
    // 定义任务
    const tasks: SpiderTask[] = [
      {
        source: 'taptap',
        options: {
          // 使用API获取数据
          useApi: true,
          limit: 10, // 每页10条
          pages: 10, // 获取10页
          // 如果需要使用模拟数据，可以替换为以下配置
          // mockFilePath: path.join(__dirname, '../mock/taptap-rank.json'),
        },
      },
      // 如果有Steam的mock数据，也可以添加Steam任务
      // {
      //   source: 'steam',
      //   options: {
      //     mockFilePath: path.join(__dirname, '../mock/steam-rank.json')
      //   }
      // }
    ]

    // 执行任务
    const results = await manager.runTasks(tasks)
    log(`[${getToday()}] 爬虫任务执行结果: ${JSON.stringify(results, null, 2)}`)

    // 查询保存的游戏数据
    const savedGames = await manager.queryGames()
    log(`[${getToday()}] 查询到 ${savedGames.length} 个游戏数据`)
  } catch (error) {
    log(`[${getToday()}] 执行爬虫任务出错: ${error}`, 'error')
  }
}

// 主函数
async function main(): Promise<void> {
  try {
    // 清理过期日志
    cleanupOldLogs()

    // 创建爬虫管理器
    const manager = new SpiderManager()

    // 初始化
    await manager.initialize()

    log('爬虫服务启动成功')

    // 检查当天是否已有数据，如果没有则立即抓取一次
    // const hasTodayData = await checkTodayData(manager)
    const hasTodayData = false
    if (!hasTodayData) {
      log(`[${getToday()}] 当天没有榜单数据，立即执行抓取任务...`)
      await runSpiderTasks(manager)
    } else {
      log(`[${getToday()}] 当天已有榜单数据，跳过立即抓取`)
    }

    // 设置定时任务，每天23:50执行
    log('设置定时任务，每天23:50执行抓取...')
    cron.schedule('50 23 * * *', async () => {
      log(`[${getToday()}] 定时任务触发，开始执行抓取...`)
      await runSpiderTasks(manager)
    })

    // 设置日志清理定时任务，每天凌晨1点执行
    log('设置日志清理定时任务，每天凌晨1点执行...')
    cron.schedule('0 1 * * *', () => {
      log('执行日志清理任务...')
      cleanupOldLogs()
    })

    // 防止程序退出
    log('程序已启动，等待定时任务执行...')

    // 处理进程退出信号
    process.on('SIGINT', async () => {
      log('接收到退出信号，关闭数据库连接...')
      await manager.close()
      process.exit(0)
    })
  } catch (error) {
    log(`程序执行出错: ${error}`, 'error')
  }
}

// 执行主函数
main()
