import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'dev.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
