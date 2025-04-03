import path from "path";

// 获取项目根目录
export const ROOT_DIR = path.resolve(__dirname, "../../../../");

// 数据目录
export const DATA_DIR = path.resolve(ROOT_DIR, "data");

// 数据库文件路径
export const DB_PATH = path.resolve(DATA_DIR, "taptap.db");

// 获取数据文件路径
export const getDataFilePath = (filename: string) =>
  path.resolve(DATA_DIR, filename);
