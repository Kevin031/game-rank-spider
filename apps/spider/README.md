# 游戏排行榜数据爬虫

一个用于爬取游戏平台排行榜数据的爬虫项目，支持TapTap和Steam等平台。

## 功能特性

- 支持多种游戏平台数据爬取：TapTap、Steam（待实现）
- 数据自动存储到SQLite数据库
- 支持使用模拟数据或真实API
- 支持多页数据爬取和分页控制

## 安装

```bash
# 安装依赖
pnpm install

# 编译TypeScript
pnpm build
```

## 使用方法

### 爬取TapTap热门榜前20条数据

```bash
# 使用ts-node直接运行爬虫脚本
pnpm crawl:taptap
```

数据将保存在`data/taptap-top20.json`文件中。

### 运行完整的爬虫流程（包括数据库存储）

```bash
# 启动主程序
pnpm start

# 或者指定爬取TapTap数据
pnpm taptap
```

## 数据输出

- SQLite数据库：`data/taptap.db`
- JSON输出：`data/taptap-top20.json`

## 技术栈

- TypeScript
- Node.js
- SQLite
- Axios

## 开发

```bash
# 开发模式运行
pnpm dev
```

## 项目结构

```
game-rank-spider/
├── data/              # 数据库文件目录
├── mock/              # 模拟数据文件
├── src/               # 源代码目录
│   ├── db/            # 数据库相关模块
│   ├── managers/      # 管理器模块
│   ├── models/        # 数据模型
│   ├── spiders/       # 爬虫模块
│   ├── utils/         # 工具函数
│   └── index.js       # 主程序入口
├── package.json
└── README.md
```

## 功能特点

- 支持多个游戏平台数据源（TapTap、Steam等）
- 模块化设计，便于扩展
- 爬虫管理器可批量执行多个爬虫任务
- 使用SQLite数据库存储数据
- 支持增量更新游戏数据

## 数据库结构

### games表

存储游戏基本信息

| 字段名      | 类型     | 说明                     |
| ----------- | -------- | ------------------------ |
| id          | INTEGER  | 主键（自增）             |
| taptap_id   | INTEGER  | TapTap游戏ID             |
| steam_id    | INTEGER  | Steam游戏ID              |
| source      | TEXT     | 数据来源（taptap/steam） |
| title       | TEXT     | 游戏标题                 |
| description | TEXT     | 游戏描述                 |
| logo_url    | TEXT     | 游戏logo URL             |
| banner_url  | TEXT     | 游戏banner URL           |
| url         | TEXT     | 游戏详情页URL            |
| created_at  | DATETIME | 记录创建时间             |
| updated_at  | DATETIME | 记录更新时间             |

### rankings表

存储每日榜单数据

| 字段名         | 类型     | 说明                  |
| -------------- | -------- | --------------------- |
| id             | INTEGER  | 主键（自增）          |
| game_id        | INTEGER  | 游戏ID（外键）        |
| rank_date      | DATE     | 榜单日期              |
| rank_type      | TEXT     | 榜单类型（hot/new等） |
| position       | INTEGER  | 排名位置              |
| fans_count     | INTEGER  | 粉丝数量              |
| hits_total     | INTEGER  | 总点击量              |
| hits_total_val | INTEGER  | 总点击值              |
| wish_count     | INTEGER  | 愿望单数量            |
| created_at     | DATETIME | 记录创建时间          |

### tags表

存储游戏标签信息

| 字段名    | 类型    | 说明                     |
| --------- | ------- | ------------------------ |
| id        | INTEGER | 主键（自增）             |
| taptap_id | INTEGER | TapTap标签ID             |
| steam_id  | INTEGER | Steam标签ID              |
| source    | TEXT    | 数据来源（taptap/steam） |
| name      | TEXT    | 标签名称                 |
| uri       | TEXT    | 标签URI                  |

### game_tags表

游戏和标签的关联表

| 字段名  | 类型    | 说明           |
| ------- | ------- | -------------- |
| game_id | INTEGER | 游戏ID（外键） |
| tag_id  | INTEGER | 标签ID（外键） |

## 扩展新的数据源

1. 在 `src/spiders/` 目录下创建新的爬虫模块
2. 在 `src/managers/spider-manager.js` 中注册新的爬虫
3. 根据需要修改数据模型和数据库结构
