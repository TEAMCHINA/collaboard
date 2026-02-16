import initSqlJs, { type Database } from "sql.js";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || "collaboard.db";

let db: Database | null = null;

export async function initSqlite(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log(`SQLite loaded from ${DB_PATH}`);
  } else {
    db = new SQL.Database();
    console.log(`SQLite created new database`);
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS board_snapshots (
      token TEXT NOT NULL,
      elements TEXT NOT NULL,
      seq_num INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (token)
    )
  `);
}

export function getDb(): Database {
  if (!db) throw new Error("SQLite not initialized");
  return db;
}

export function persistToFile(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  // Write to temp file then rename for atomicity
  const tmpPath = DB_PATH + ".tmp";
  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, DB_PATH);
}
