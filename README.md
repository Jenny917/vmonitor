# VPS Monitoring System

Full-stack monitoring dashboard for VPS instances hosted on Hax.co.id. The system periodically scrapes renewal details, stores them in SQLite, and presents a management UI with CRUD operations, manual refresh controls, and automatic scheduled updates.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via `sql.js`)
- **Scraping**: `node-fetch`, `cheerio`, `luxon`
- **Scheduler**: `node-cron`
- **Frontend**: React (Vite + TypeScript), Tailwind CSS

## Project Structure

```
/home/engine/project
├── client   # React + Vite frontend
└── server   # Express + TypeScript backend
    └── monitor.db (created automatically on first run)
```

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

Install dependencies for both the server and client:

```bash
cd server
npm install

cd ../client
npm install
```

## Running Locally

Start the backend (port `4000` by default):

```bash
cd server
npm run dev
```

In a separate terminal, start the frontend (Vite dev server on `5173` with a proxy to the backend):

```bash
cd client
npm run dev
```

The SQLite database (`monitor.db`) will be created automatically under the `server/` directory with the required schema on first run.

## Production Build

1. Build the frontend:

   ```bash
   cd client
   npm run build
   ```

2. Copy or host the generated `client/dist` output behind the backend (the Express server automatically serves static assets from `client/dist` when it exists).

3. Build and start the backend:

   ```bash
   cd server
   npm run build
   npm start
   ```

## API Endpoints

- `GET /api/vps` – List all VPS records.
- `POST /api/vps` – Create a VPS `{ name, ops, cookie }`.
- `PUT /api/vps/:id` – Update VPS details.
- `DELETE /api/vps/:id` – Remove a VPS.
- `POST /api/vps/:id/refresh` – Trigger a scrape for a single VPS.
- `POST /api/vps/refresh-all` – Trigger scraping for every VPS.

## Scraping & Scheduling

- Scraper hits `https://hax.co.id/vps-info` using the stored cookie.
- Parses "Valid until", "IPv6", "Location", and "VPS Creation Date" values with Cheerio.
- Date values are converted from Jakarta time (WIB, UTC+7) to Malaysia time (MYT, UTC+8).
- Successful scrapes mark the cookie status as `Normal`; failures mark it as `Invalid` and preserve previously stored values.
- A cron job runs hourly (`0 * * * *`). You can override the schedule via the `SCRAPE_CRON` environment variable.

## Environment Variables

- `PORT` – Port for the backend server (default `4000`).
- `SCRAPE_CRON` – Custom cron expression for the background refresh schedule.

## Development Notes

- Cookies are stored securely in the SQLite database and surfaced to the UI for management but never displayed openly.
- All timestamps are stored as ISO-8601 strings in MYT (`Asia/Kuala_Lumpur`) and formatted on the frontend.
- The dashboard offers CRUD actions, manual refresh controls, and displays cookie validity, renewal dates, locations, creation dates, and IPv6 addresses for each VPS.

## Security

This application handles sensitive data (VPS cookies and IP addresses) with the following security measures:

### Data Protection
- **Cookies** - Never exposed in API responses (shown as `***hidden***`)
- **IP Addresses** - Masked in API responses (e.g., `2602:****:****:****:****:****:****:0001`)
- **Database** - Contains full data but never committed to git
- **Logs** - Sensitive values are never logged to console

### Best Practices
- **Never commit `.env` files** - they contain sensitive configuration
- **Never commit `.db` files** - they contain your VPS cookies and IPs
- **Never share screenshots** - of DevTools Network tab or database contents
- **API responses** - All sensitive data is automatically masked

### What to check before committing:
```bash
git status
# Should NOT see: .env, *.db files
```

### Masked Data Format
- **Cookie**: `***hidden***`
- **IPv6**: `2602:****:****:****:****:****:****:0001` (first and last segment only)
- **IPv4**: `192.***.***.100` (first and last octet only)

## License

MIT © 2024 VPS Monitoring System
