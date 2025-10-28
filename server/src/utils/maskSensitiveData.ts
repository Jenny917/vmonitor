import { VpsRecord } from '../types';

export type VpsData = VpsRecord;

export type SafeVpsData = Omit<VpsData, 'cookie' | 'ip'> & {
  cookie: string;
  ip: string | null;
};

export const MASKED_COOKIE_VALUE = '***hidden***';

/**
 * Mask cookie - replace with placeholder
 */
export function maskCookie(cookie: string): string {
  if (!cookie) {
    return '';
  }

  return MASKED_COOKIE_VALUE;
}

/**
 * Mask IP address - show only first and last segment
 * Examples:
 *   IPv6: 2602:294:0:dc:1234:4321:5019:0001 -> 2602:****:****:****:****:****:****:0001
 *   IPv4: 192.168.1.100 -> 192.***.***.100
 */
export function maskIp(ip: string): string {
  if (!ip) {
    return '';
  }

  if (ip.includes(':')) {
    const segments = ip.split(':');

    if (segments.length >= 3) {
      return segments
        .map((segment, index) => {
          if (segment === '' || index === 0 || index === segments.length - 1) {
            return segment;
          }
          return '****';
        })
        .join(':');
    }
  }

  if (ip.includes('.')) {
    const segments = ip.split('.');

    if (segments.length === 4) {
      return `${segments[0]}.***.***.${segments[3]}`;
    }
  }

  return MASKED_COOKIE_VALUE;
}

/**
 * Mask sensitive VPS data for API responses
 */
export function maskVpsData(vps: VpsData): SafeVpsData {
  return {
    ...vps,
    cookie: maskCookie(vps.cookie),
    ip: vps.ip ? maskIp(vps.ip) : null
  };
}

/**
 * Mask array of VPS data
 */
export function maskVpsDataArray(vpsList: VpsData[]): SafeVpsData[] {
  return vpsList.map(maskVpsData);
}
