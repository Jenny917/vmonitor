export interface VpsRecord {
  id: number;
  name: string;
  ops: string;
  cookie: string;
  valid_until: string | null;
  ip: string | null;
  location: string | null;
  creation_date: string | null;
  cookie_status: 'Normal' | 'Invalid';
  update_time: string | null;
}

export interface VpsCreateInput {
  name: string;
  ops: string;
  cookie: string;
}

export interface VpsUpdateInput {
  name?: string;
  ops?: string;
  cookie?: string;
}

export interface ScrapeResult {
  validUntil: string | null;
  ip: string | null;
  location: string | null;
  creationDate: string | null;
  cookieStatus: 'Normal' | 'Invalid';
  updateTime: string;
  error?: string;
}
