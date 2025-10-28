import cron from 'node-cron';
import { refreshAllVps } from './refreshService';

const SCHEDULE = process.env.SCRAPE_CRON || '0 * * * *';

export function startScheduler(): void {
  cron.schedule(SCHEDULE, async () => {
    console.log(`[Scheduler] Running VPS refresh job at ${new Date().toISOString()}`);
    try {
      await refreshAllVps();
      console.log('[Scheduler] VPS refresh job completed successfully.');
    } catch (error) {
      console.error('[Scheduler] VPS refresh job failed:', error);
    }
  });
}
