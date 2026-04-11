import Database from "better-sqlite3";

const db = new Database("/database/data.db");

db.prepare(
  `
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      price REAL NOT NULL,
      source TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
).run();

export default db;
