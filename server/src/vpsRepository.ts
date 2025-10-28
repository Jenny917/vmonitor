import db from './db';
import { VpsCreateInput, VpsRecord, VpsUpdateInput } from './types';

export function getAllVps(): VpsRecord[] {
  const stmt = db.prepare('SELECT * FROM vps ORDER BY id DESC');
  return stmt.all() as VpsRecord[];
}

export function getVpsById(id: number): VpsRecord | undefined {
  const stmt = db.prepare('SELECT * FROM vps WHERE id = ?');
  return stmt.get(id) as VpsRecord | undefined;
}

export function createVps(data: VpsCreateInput): number {
  const stmt = db.prepare(
    'INSERT INTO vps (name, ops, cookie, cookie_status) VALUES (?, ?, ?, ?)' 
  );
  const result = stmt.run(data.name, data.ops, data.cookie, 'Normal');
  return Number(result.lastInsertRowid);
}

export function updateVps(id: number, data: VpsUpdateInput): void {
  const fields: string[] = [];
  const params: unknown[] = [];

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
  const stmt = db.prepare(`UPDATE vps SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params);
}

export function deleteVps(id: number): void {
  const stmt = db.prepare('DELETE FROM vps WHERE id = ?');
  stmt.run(id);
}

export function updateAfterScrapeSuccess(
  id: number,
  data: {
    validUntil: string | null;
    ip: string | null;
    location: string | null;
    creationDate: string | null;
    updateTime: string;
  }
): void {
  const stmt = db.prepare(
    `UPDATE vps
     SET valid_until = ?,
         ip = ?,
         location = COALESCE(?, location),
         creation_date = COALESCE(?, creation_date),
         cookie_status = 'Normal',
         update_time = ?
     WHERE id = ?`
  );

  stmt.run(
    data.validUntil,
    data.ip,
    data.location,
    data.creationDate,
    data.updateTime,
    id
  );
}

export function updateAfterScrapeFailure(id: number, updateTime: string): void {
  const stmt = db.prepare(
    `UPDATE vps
     SET cookie_status = 'Invalid',
         update_time = ?
     WHERE id = ?`
  );
  stmt.run(updateTime, id);
}
