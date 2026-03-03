import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";

const dbPath = process.env.DB_PATH || "data/app.db";
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./drizzle" });

console.log("Database migrations complete.");
sqlite.close();
