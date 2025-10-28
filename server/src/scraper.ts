import fetch from 'node-fetch';
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { DateTime } from 'luxon';
import { ScrapeResult } from './types';

const TARGET_URL = 'https://hax.co.id/vps-info';

const BASE_HEADERS: Record<string, string> = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  referer: 'https://hax.co.id/',
  'sec-ch-ua': '"Google Chrome";v="141", "Chromium";v="141", "Not=A?Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1'
};

const JAKARTA_TZ = 'Asia/Jakarta';
const MALAYSIA_TZ = 'Asia/Kuala_Lumpur';

function normalizeLabel(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/:/g, '').trim().toLowerCase();
}

function extractValue($: CheerioAPI, label: string): string | null {
  const desired = normalizeLabel(label);
  let value: string | null = null;

  $('tr').each((_, element) => {
    const firstCell = $(element).find('th, td').first();
    const labelText = normalizeLabel(firstCell.text());

    if (labelText === desired) {
      const valueCell = firstCell.next('td');
      if (valueCell.length > 0) {
        value = valueCell.text().replace(/\s+/g, ' ').trim();
      } else {
        const cells = $(element).find('td');
        if (cells.length > 0) {
          value = cells.last().text().replace(/\s+/g, ' ').trim();
        }
      }
      return false;
    }

    return undefined;
  });

  return value;
}

function parseDateToMalaysia(dateText: string): DateTime | null {
  const cleaned = dateText.replace(/\s+/g, ' ').replace(/(WIB|UTC\+?7)/gi, '').trim();
  if (!cleaned) {
    return null;
  }

  const formats = [
    'LLLL d, yyyy HH:mm',
    'LLLL d, yyyy H:mm',
    'LLLL d, yyyy h:mm a',
    'LLLL d, yyyy',
    'dd LLL yyyy HH:mm',
    'dd LLL yyyy h:mm a',
    'dd LLL yyyy',
    'd LLLL yyyy',
    'd MMM yyyy',
    'yyyy-LL-dd HH:mm',
    'yyyy-LL-dd'
  ];

  for (const format of formats) {
    const parsed = DateTime.fromFormat(cleaned, format, { zone: JAKARTA_TZ });
    if (parsed.isValid) {
      return parsed.setZone(MALAYSIA_TZ);
    }
  }

  const jsDate = new Date(cleaned);
  if (!Number.isNaN(jsDate.valueOf())) {
    return DateTime.fromJSDate(jsDate, { zone: JAKARTA_TZ }).setZone(MALAYSIA_TZ);
  }

  return null;
}

export async function scrapeVpsInfo(cookie: string): Promise<ScrapeResult> {
  const response = await fetch(TARGET_URL, {
    headers: {
      ...BASE_HEADERS,
      cookie
    }
  });

  const updateTime = DateTime.now().setZone(MALAYSIA_TZ).toISO();

  if (!response.ok) {
    return {
      validUntil: null,
      ip: null,
      location: null,
      creationDate: null,
      cookieStatus: 'Invalid',
      updateTime,
      error: `Request failed with status ${response.status}`
    };
  }

  const html = await response.text();
  const $ = load(html);

  const validUntilText = extractValue($, 'Valid until');
  const ipv6 = extractValue($, 'IPv6');
  const location = extractValue($, 'Location');
  const creationDateText = extractValue($, 'VPS Creation Date');

  if (!validUntilText || !ipv6 || !location || !creationDateText) {
    return {
      validUntil: null,
      ip: null,
      location: null,
      creationDate: null,
      cookieStatus: 'Invalid',
      updateTime,
      error: 'Required VPS data could not be found in the scraped page.'
    };
  }

  const validUntil = parseDateToMalaysia(validUntilText);
  const creationDate = parseDateToMalaysia(creationDateText);

  if (!validUntil || !creationDate) {
    return {
      validUntil: null,
      ip: ipv6,
      location,
      creationDate: null,
      cookieStatus: 'Invalid',
      updateTime,
      error: 'Unexpected date format encountered while parsing VPS data.'
    };
  }

  return {
    validUntil: validUntil.toISO(),
    ip: ipv6,
    location,
    creationDate: creationDate.toISO(),
    cookieStatus: 'Normal',
    updateTime
  };
}
