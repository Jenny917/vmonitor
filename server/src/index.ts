import app from './app';
import { startScheduler } from './scheduler';
import { DATABASE_PATH } from './db';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`VPS monitor server listening on port ${PORT}`);
  console.log(`Using SQLite database at ${DATABASE_PATH}`);
});

startScheduler();
