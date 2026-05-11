import Database from 'better-sqlite3';

export type BfsDb = Database.Database;

export function openDatabase(path: string): BfsDb {
  const db = new Database(path);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  return db;
}
