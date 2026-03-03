import { Database } from "bun:sqlite";

const dbPath = process.env.DB_PATH || "data/app.db";
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS application_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

try {
  sqlite.exec(`ALTER TABLE applications ADD COLUMN cover_letter_text TEXT;`);
} catch {
  // Column already exists
}

console.log("Database migrations complete.");
sqlite.close();
