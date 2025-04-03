import { Database } from "sqlite3";

// 爬虫来源类型
export type SpiderSource = "taptap" | "steam";

// 爬虫任务选项
export interface SpiderOptions {
  mockFilePath?: string;
  useApi?: boolean; // 是否使用API
  page?: number; // 页码
  limit?: number; // 每页条数
  pages?: number; // 要获取的页数
  [key: string]: any;
}

// 爬虫任务
export interface SpiderTask {
  source: SpiderSource;
  options?: SpiderOptions;
}

// 爬虫任务结果
export interface TaskResult {
  success: boolean;
  count?: number;
  savedIds?: number[];
  error?: string;
}

// 标签类型
export interface Tag {
  id: number | string;
  name: string;
  uri?: string;
  source?: SpiderSource;
}

// 游戏信息接口
export interface GameInfoParams {
  id?: number | null;
  taptap_id?: number | string | null;
  steam_id?: number | string | null;
  source: SpiderSource;
  title: string;
  description?: string;
  hits_total?: number;
  logo_url?: string;
  banner_url?: string;
  tags?: Tag[];
  fans_count?: number;
  hits_total_val?: number;
  wish_count?: number;
  url?: string;
  position?: number; // 在榜单中的位置
}

// 排行榜信息
export interface RankInfo {
  date: string; // 榜单日期，格式YYYY-MM-DD
  type: string; // 榜单类型，如'hot'、'new'等
}

// 数据库游戏查询选项
export interface QueryOptions {
  source?: SpiderSource;
  limit?: number;
  offset?: number;
  date?: string; // 查询特定日期的榜单，格式：YYYY-MM-DD
  rankType?: string; // 榜单类型，如'hot'、'new'等
}

// TapTap API返回的标签结构
export interface TapTapTag {
  id: number;
  value: string;
  uri: string;
}

// TapTap API返回的应用结构
export interface TapTapApp {
  id: number;
  title: string;
  description?: {
    text: string;
  };
  stat?: {
    hits_total: number;
    fans_count: number;
    hits_total_val: number;
    wish_count: number;
  };
  icon?: {
    original_url: string;
  };
  banner?: {
    original_url: string;
  };
  tags?: TapTapTag[];
}

// TapTap API返回的列表项结构
export interface TapTapListItem {
  type: string;
  app?: TapTapApp;
}

export interface TapTapResponse {
  data: {
    list: TapTapListItem[];
    total: number;
    primary_button: number;
    log_keyword: string;
    description: string;
    prev_page: string;
    next_page: string;
  };
  now: number;
  success: boolean;
}

// Steam API相关的类型定义
export interface SteamGenre {
  id: number;
  description: string;
}

export interface SteamApp {
  appid: number;
  name: string;
  detailed_description?: string;
  owners?: number;
  header_image?: string;
  background?: string;
  followers?: number;
  player_count?: number;
  wishlist_count?: number;
  genres?: SteamGenre[];
}

export interface SteamResponse {
  applist: {
    apps: SteamApp[];
  };
}

// 数据库查询结果类型
export interface GameRecord {
  id: number;
  taptap_id: number | null;
  steam_id: number | null;
  source: SpiderSource;
  title: string;
  description: string;
  hits_total: number;
  logo_url: string;
  banner_url: string;
  url: string;
  fans_count: number;
  hits_total_val: number;
  wish_count: number;
  created_at: string;
  updated_at: string;
  tag_names?: string;
}
