import { scrapeVpsInfo } from './scraper';
import {
  getAllVps,
  getVpsById,
  updateAfterScrapeFailure,
  updateAfterScrapeSuccess
} from './vpsRepository';
import { VpsRecord } from './types';

export async function refreshVpsById(id: number): Promise<VpsRecord> {
  const vps = getVpsById(id);
  if (!vps) {
    throw new Error('VPS not found');
  }

  const result = await scrapeVpsInfo(vps.cookie);

  if (result.cookieStatus === 'Normal') {
    updateAfterScrapeSuccess(id, {
      validUntil: result.validUntil,
      ip: result.ip,
      location: result.location,
      creationDate: result.creationDate,
      updateTime: result.updateTime
    });
  } else {
    console.warn(
      `Scrape returned ${result.cookieStatus} for VPS ${id}${result.error ? `: ${result.error}` : ''}`
    );
    updateAfterScrapeFailure(id, result.updateTime);
  }

  const updated = getVpsById(id);
  if (!updated) {
    throw new Error('Failed to load updated VPS record');
  }

  return updated;
}

export async function refreshAllVps(): Promise<VpsRecord[]> {
  const vpsList = getAllVps();
  const refreshed: VpsRecord[] = [];

  for (const vps of vpsList) {
    try {
      const updated = await refreshVpsById(vps.id);
      refreshed.push(updated);
    } catch (error) {
      console.error(`Failed to refresh VPS ${vps.id}:`, error);
    }
  }

  return refreshed;
}
