import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', '..', 'monitor.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS vps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ops TEXT NOT NULL,
    cookie TEXT NOT NULL,
    valid_until TEXT,
    ip TEXT,
    location TEXT,
    creation_date TEXT,
    cookie_status TEXT DEFAULT 'Normal',
    update_time TEXT
  );
`);

export default db;
export { dbPath as DATABASE_PATH };
