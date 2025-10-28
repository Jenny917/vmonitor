import {
  addVPS,
  deleteVPS,
  getAllVPS,
  getDatabase,
  getVPSById,
  saveDatabase,
  updateVPS
} from './db';
import { VpsCreateInput, VpsRecord, VpsUpdateInput } from './types';

export async function getAllVps(): Promise<VpsRecord[]> {
  return getAllVPS();
}

export async function getVpsById(id: number): Promise<VpsRecord | undefined> {
  return getVPSById(id);
}

export async function createVps(data: VpsCreateInput): Promise<number> {
  return addVPS(data);
}

export async function updateVps(id: number, data: VpsUpdateInput): Promise<void> {
  await updateVPS(id, data);
}

export async function deleteVps(id: number): Promise<void> {
  await deleteVPS(id);
}

export async function updateAfterScrapeSuccess(
  id: number,
  data: {
    validUntil: string | null;
    ip: string | null;
    location: string | null;
    creationDate: string | null;
    updateTime: string;
  }
): Promise<void> {
  const db = getDatabase();
  const statement = db.prepare(
    `UPDATE vps
     SET valid_until = ?,
         ip = ?,
         location = COALESCE(?, location),
         creation_date = COALESCE(?, creation_date),
         cookie_status = 'Normal',
         update_time = ?
     WHERE id = ?`
  );

  try {
    statement.run([
      data.validUntil,
      data.ip,
      data.location,
      data.creationDate,
      data.updateTime,
      id
    ]);
  } finally {
    statement.free();
  }

  await saveDatabase();
}

export async function updateAfterScrapeFailure(
  id: number,
  updateTime: string
): Promise<void> {
  const db = getDatabase();
  const statement = db.prepare(
    `UPDATE vps
     SET cookie_status = 'Invalid',
         update_time = ?
     WHERE id = ?`
  );

  try {
    statement.run([updateTime, id]);
  } finally {
    statement.free();
  }

  await saveDatabase();
}
