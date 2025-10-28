import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import { promises as fs } from 'fs';
import { VpsCreateInput, VpsRecord, VpsUpdateInput } from './types';

let sqlJsInstance: SqlJsStatic | null = null;
let database: Database | null = null;

type SqlValue = string | number | null | Uint8Array;

export const DATABASE_PATH = path.resolve(__dirname, '..', 'monitor.db');

function ensureDatabase(): Database {
  if (!database) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return database;
}

export async function initDatabase(): Promise<void> {
  if (database) {
    return;
  }

  if (!sqlJsInstance) {
    sqlJsInstance = await initSqlJs({
      locateFile: (file) =>
        path.resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
    });
  }

  const SQL = sqlJsInstance;
  if (!SQL) {
    throw new Error('Failed to initialize sql.js');
  }

  let fileBuffer: Uint8Array | null = null;
  let existingFile = true;

  try {
    const file = await fs.readFile(DATABASE_PATH);
    fileBuffer = new Uint8Array(file);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      existingFile = false;
    } else {
      throw error;
    }
  }

  database = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  database.exec(`
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

  if (!existingFile) {
    await saveDatabase();
  }
}

export function getDatabase(): Database {
  return ensureDatabase();
}

export async function saveDatabase(): Promise<void> {
  const db = ensureDatabase();
  const data = db.export();
  await fs.writeFile(DATABASE_PATH, Buffer.from(data));
}

function runSelect<T>(sql: string, params: SqlValue[] = []): T[] {
  const db = ensureDatabase();
  const statement = db.prepare(sql);

  try {
    if (params.length > 0) {
      statement.bind(params);
    }

    const rows: T[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
    return rows;
  } finally {
    statement.free();
  }
}

function getLastInsertRowId(db: Database): number {
  const result = db.exec('SELECT last_insert_rowid() AS id;');
  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }
  return Number(result[0].values[0][0]);
}

export function getAllVPS(): VpsRecord[] {
  return runSelect<VpsRecord>('SELECT * FROM vps ORDER BY id DESC');
}

export function getVPSById(id: number): VpsRecord | undefined {
  return runSelect<VpsRecord>('SELECT * FROM vps WHERE id = ?', [id])[0];
}

export async function addVPS(data: VpsCreateInput): Promise<number> {
  const db = ensureDatabase();
  const statement = db.prepare(
    'INSERT INTO vps (name, ops, cookie, cookie_status) VALUES (?, ?, ?, ?)'
  );

  try {
    statement.run([data.name, data.ops, data.cookie, 'Normal']);
  } finally {
    statement.free();
  }

  const id = getLastInsertRowId(db);
  await saveDatabase();
  return id;
}

export async function updateVPS(id: number, data: VpsUpdateInput): Promise<void> {
  const fields: string[] = [];
  const params: SqlValue[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.ops !== undefined) {
    fields.push('ops = ?');
    params.push(data.ops);
  }
  if (data.cookie !== undefined) {
    fields.push('cookie = ?');
    params.push(data.cookie);
  }

  if (fields.length === 0) {
    return;
  }

  params.push(id);

  const db = ensureDatabase();
  const statement = db.prepare(`UPDATE vps SET ${fields.join(', ')} WHERE id = ?`);

  try {
    statement.run(params);
  } finally {
    statement.free();
  }

  await saveDatabase();
}

export async function deleteVPS(id: number): Promise<void> {
  const db = ensureDatabase();
  const statement = db.prepare('DELETE FROM vps WHERE id = ?');

  try {
    statement.run([id]);
  } finally {
    statement.free();
  }

  await saveDatabase();
}
