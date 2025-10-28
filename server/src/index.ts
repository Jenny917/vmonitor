import app from './app';
import { startScheduler } from './scheduler';
import { DATABASE_PATH, initDatabase } from './db';

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`VPS monitor server listening on port ${PORT}`);
      console.log(`Using SQLite database at ${DATABASE_PATH}`);
      startScheduler();
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

void start();
