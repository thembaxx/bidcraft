import type { TenderProject } from '@/lib/types';
import { isRecord } from '@/lib/validation';
import { formatSouthAfricanDate } from '@/lib/locale';
import { DEFAULT_FILTERS, DISCOVERY_HOME, type DiscoveryFilters, type DiscoveryIndex, type DiscoveryResponse, type TenderNotice } from './types';

export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const text = (key: string, max = 180) => {
    const value = params.get(key) ?? '';
    if (value.length > max || /[\x00-\x1f]/.test(value)) throw new Error(`Invalid ${key} filter.`);
    return value.trim();
  };
  const choice = <T extends string>(key: string, choices: readonly T[], fallback: T): T => {
    const value = params.get(key);
    if (!value) return fallback;
    if (!choices.includes(value as T)) throw new Error(`Invalid ${key} filter.`);
    return value as T;
  };
  const pageText = params.get('page') || '1';
  if (!/^\d{1,5}$/.test(pageText) || Number(pageText) < 1 || Number(pageText) > 10000) throw new Error('Invalid results page.');
  return {
    q: text('q'), province: text('province'), category: text('category'), buyer: text('buyer'), type: text('type'),
    closing: choice('closing', ['any', '7', '14', '30'], 'any'), published: choice('published', ['any', '7', '30'], 'any'),
    briefing: choice('briefing', ['any', 'required', 'optional', 'none', 'unknown'], 'any'),
    notices: choice('notices', ['opportunities', 'all'], 'opportunities'), sort: choice('sort', ['newest', 'closing'], 'newest'), page: Number(pageText),
  };
}

export function filterParams(filters: DiscoveryFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== DEFAULT_FILTERS[key as keyof DiscoveryFilters]) params.set(key, String(value));
  return params;
}

export function sourceDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value) || value.startsWith('0001-') || value.startsWith('1900-')) return null;
  const day = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  // Treasury's public portal publishes South African wall-clock times without offsets.
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? value : `${value}+02:00`;
  return Number.isFinite(Date.parse(normalized)) ? normalized : null;
}

export function formatTenderDate(value: string | null, withTime = false): string {
  return formatSouthAfricanDate(value, withTime);
}

export function noticeKind(title: string, type: string): TenderNotice['noticeKind'] {
  if (/names? of bidders|bidders? (?:list|received)|(?:publication|notice) of (?:award|cancellation)|awarded tender/i.test(title)) return 'results';
  if (/request(?:ing)? for information|\bRFI\b|expression of interest/i.test(`${title} ${type}`)) return 'information';
  return 'opportunity';
}

export function searchIndex(index: DiscoveryIndex, filters: DiscoveryFilters, now = Date.now()): DiscoveryResponse {
  const tokens = filters.q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = index.notices.filter((item) => {
    if (filters.notices === 'opportunities' && item.noticeKind !== 'opportunity') return false;
    if (filters.province && item.province !== filters.province || filters.category && item.category !== filters.category || filters.buyer && !item.buyer.toLocaleLowerCase().includes(filters.buyer.toLocaleLowerCase()) || filters.type && item.procurementType !== filters.type) return false;
    if (filters.briefing !== 'any' && item.briefing !== filters.briefing) return false;
    const haystack = `${item.title} ${item.reference} ${item.buyer}`.toLocaleLowerCase();
    if (tokens.some((token) => !haystack.includes(token))) return false;
    if (filters.closing !== 'any') {
      const end = item.closesAt ? Date.parse(item.closesAt) : NaN;
      if (!Number.isFinite(end) || end < now || end > now + Number(filters.closing) * 86400000) return false;
    }
    if (filters.published !== 'any') {
      const published = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
      if (!Number.isFinite(published) || published < now - Number(filters.published) * 86400000 || published > now) return false;
    }
    return true;
  }).sort((a, b) => {
    const aTime = filters.sort === 'closing' ? a.closesAt : a.publishedAt;
    const bTime = filters.sort === 'closing' ? b.closesAt : b.publishedAt;
    if (!aTime && bTime) return 1;
    if (!bTime && aTime) return -1;
    const comparison = aTime && bTime ? Date.parse(aTime) - Date.parse(bTime) : 0;
    return (filters.sort === 'closing' ? comparison : -comparison) || a.id.localeCompare(b.id);
  });
  const unique = (key: 'province' | 'category' | 'buyer' | 'procurementType') => [...new Set(index.notices.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const pageSize = 12;
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize,
    sourceTotal: index.sourceTotal, indexed: index.notices.length, complete: index.complete, checkedAt: index.checkedAt,
    stale: now - Date.parse(index.checkedAt) > 20 * 60000,
    facets: { provinces: unique('province'), categories: unique('category'), buyers: unique('buyer'), types: unique('procurementType') },
  };
}

export function isTenderNotice(value: unknown): value is TenderNotice {
  if (!isRecord(value)) return false;
  return ['id', 'reference', 'title', 'buyer', 'province', 'category', 'procurementType', 'sourceStatus', 'sourceUrl'].every((key) => typeof value[key] === 'string') &&
    /^\d{1,10}$/.test(value.id as string) && ['required', 'optional', 'none', 'unknown'].includes(value.briefing as string) &&
    ['opportunity', 'information', 'results'].includes(value.noticeKind as string) &&
    ['publishedAt', 'closesAt', 'briefingAt'].every((key) => value[key] === null || typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key] as string))) &&
    typeof value.documentCount === 'number' && value.documentCount >= 0 && Number.isInteger(value.documentCount) &&
    isOfficialUrl(value.sourceUrl as string);
}

export function isOfficialUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && ['www.etenders.gov.za', 'ocds-api.etenders.gov.za'].includes(url.hostname) && !url.username && !url.password; } catch { return false; }
}

export function createBidFromNotice(notice: TenderNotice): TenderProject {
  return {
    id: `tender-${crypto.randomUUID()}`, title: notice.title, Authority: notice.buyer || 'Not published', rfpNumber: notice.reference,
    budget: 'Not published (ZAR)', deadline: notice.closesAt ? `${formatTenderDate(notice.closesAt, true)} SAST` : 'Not published',
    activeDays: 0, stage: 'qualify', leadScore: 0, grade: 'Not audited', statusLabel: 'Discovered tender', ownerName: 'Bid Team', ownerRole: 'Bid Architect', AvatarUrl: '',
    purchaseTimeframe: 'Not specified', procurementType: notice.procurementType || 'Not published', executiveSummary: '', clauses: [], versions: [], discrepancies: [],
    source: { provider: 'National Treasury eTender', noticeId: notice.id, url: notice.sourceUrl || DISCOVERY_HOME, importedAt: new Date().toISOString(), province: notice.province },
  };
}
