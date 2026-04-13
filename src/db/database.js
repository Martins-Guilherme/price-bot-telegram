import Database from "better-sqlite3";
import { configDotenv } from "dotenv";

configDotenv();

const db = new Database(process.env.DATABASE_PATH || "/database/data.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL,
    product_found TEXT NOT NULL DEFAULT 'Produto não encontrado',
    price REAL NOT NULL,
    source TEXT NOT NULL,
    image TEXT,
    link TEXT,
    created_at DATETIME DEFAULT (datetime('now', '-3 hours'))
  )
`,
).run();

export default db;
