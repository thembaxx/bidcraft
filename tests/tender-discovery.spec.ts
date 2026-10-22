import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_FILTERS, DISCOVERY_HOME, SAVED_TENDERS_KEY, TENDER_STORAGE_KEY, type DiscoveryIndex, type TenderDetail, type TenderNotice } from '../lib/discovery/types';
import { createBidFromNotice, isOfficialUrl, parseFilters, searchIndex, sourceDate } from '../lib/discovery/model';
import { isTender } from '../lib/validation';

const now = Date.now();
const date = (days: number) => new Date(now + days * 86400000).toISOString();
const notices: TenderNotice[] = Array.from({ length: 24 }, (_, index) => ({
  id: String(1001 + index), reference: `ZA-${index + 1}/2026`, title: `${index % 2 ? 'Building maintenance' : 'Solar installation'} project ${index + 1}`,
  buyer: index < 12 ? 'City Power Johannesburg' : 'Western Cape Infrastructure', province: index < 12 ? 'Gauteng' : 'Western Cape',
  category: index % 2 ? 'Facilities management' : 'Electrical equipment', procurementType: index % 2 ? 'Request for Quotation' : 'Request for Proposal',
  sourceStatus: index % 2 ? '' : 'Published', publishedAt: date(-index / 24), closesAt: date(index + 1),
  briefing: index % 3 === 0 ? 'required' : 'none', briefingAt: index % 3 === 0 ? date(1) : null, documentCount: 1,
  noticeKind: 'opportunity', sourceUrl: DISCOVERY_HOME,
}));
const index: DiscoveryIndex = { notices, sourceTotal: notices.length, complete: true, checkedAt: date(0) };
const detail = (notice: TenderNotice): TenderDetail => ({ ...notice, description: notice.title, conditions: 'Submit the original schedules and verify the compulsory briefing.', delivery: 'South Africa', briefingVenue: 'See official documents', documents: [{ id: 'doc-1', title: 'Official tender requirements.pdf', url: 'https://www.etenders.gov.za/home/Download?blobName=test.pdf' }], checkedAt: date(0), ocid: 'ocds-9t57fa-1001', ocdsUrl: 'https://ocds-api.etenders.gov.za/api/OCDSReleases/release/ocds-9t57fa-1001', ocdsChecked: true, deadlineConflict: true });

async function mockSource(page: Page, unavailable = () => false) {
  await page.route('**/api/tenders**', async (route) => {
    const url = new URL(route.request().url());
    if (unavailable()) return route.fulfill({ status: 503, json: { error: 'Source unavailable' } });
    if (url.pathname === '/api/tenders') return route.fulfill({ json: searchIndex(index, parseFilters(url.searchParams), now) });
    const notice = notices.find((item) => item.id === url.pathname.split('/').pop());
    return route.fulfill({ status: notice ? 200 : 404, json: notice ? detail(notice) : { error: 'Missing' } });
  });
}

test('discovery filters the full collection before pagination and preserves unknown source data', () => {
  const filters = parseFilters(new URLSearchParams('province=Western+Cape&q=solar&sort=closing'));
  const result = searchIndex(index, filters, now);
  expect(result.total).toBe(6); expect(result.items.every((item) => item.province === 'Western Cape')).toBe(true);
  const urgent = searchIndex(index, { ...DEFAULT_FILTERS, closing: '7' }, now);
  expect(urgent.total).toBe(7);
  const page = searchIndex(index, { ...DEFAULT_FILTERS, page: 2 }, now);
  expect(page.items).toHaveLength(12); expect(page.items[0].id).toBe('1013');
  expect(searchIndex(index, { ...DEFAULT_FILTERS, buyer: 'power' }, now).total).toBe(12);
  expect(() => parseFilters(new URLSearchParams('page=-1'))).toThrow();
  expect(() => parseFilters(new URLSearchParams('closing=365'))).toThrow();
  expect(isOfficialUrl('https://www.etenders.gov.za.evil.example/file')).toBe(false);
  expect(sourceDate('2026-10-23T13:00:00')).toBe('2026-10-23T13:00:00+02:00');
  expect(sourceDate('2026-02-30T00:00:00')).toBeNull();
  const project = createBidFromNotice(notices[0]);
  expect(isTender(project)).toBe(true); expect(project.source?.noticeId).toBe('1001');
  expect(project.clauses).toEqual([]); expect(project.versions).toEqual([]); expect(project.executiveSummary).toBe(''); expect(project.budget).toBe('Not published (ZAR)');
});

test('invalid discovery API parameters are rejected without querying the upstream source', async ({ request }) => {
  expect((await request.get('/api/tenders?page=0')).status()).toBe(400);
  expect((await request.get('/api/tenders?briefing=fake')).status()).toBe(400);
  expect((await request.get('/api/tenders/not-a-source-id')).status()).toBe(400);
});

test('filters are shareable, search the whole collection, and survive reload and browser history', async ({ page }) => {
  await mockSource(page); await page.goto('/tenders');
  await expect(page.getByRole('article')).toHaveCount(12);
  await page.getByLabel('Search tenders', { exact: true }).fill('solar');
  await page.getByLabel('Province', { exact: true }).selectOption('Western Cape');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/province=Western\+Cape/);
  await expect(page.getByRole('article')).toHaveCount(6);
  await expect(page.getByRole('article').first()).toContainText('Solar installation project 13');
  await page.reload(); await expect(page.getByLabel('Province', { exact: true })).toHaveValue('Western Cape');
  await expect(page.getByRole('article')).toHaveCount(6);
  await page.getByRole('button', { name: 'Remove province filter', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(12);
  await page.goBack(); await expect(page.getByRole('article')).toHaveCount(6);
});

test('saved tenders and cached source details remain usable when Treasury is unavailable', async ({ page }) => {
  let unavailable = false;
  await mockSource(page, () => unavailable); await page.goto('/tenders');
  await page.getByRole('button', { name: 'Solar installation project 1', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: /Official tender requirements/ })).toHaveAttribute('href', /https:\/\/www.etenders.gov.za/);
  await expect(dialog.getByText(/official feeds show different closing times/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Save tender', exact: true }).click();
  await expect(dialog.getByText('Tender saved in this browser.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  unavailable = true;
  await page.getByRole('link', { name: /Saved 1/ }).click();
  await expect(page).toHaveURL(/view=saved/);
  await page.reload(); await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Solar installation project 1', exact: true }).click();
  await expect(dialog.getByText(/Showing your saved source details/)).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Official tender requirements/ })).toBeVisible();
});

test('import creates a blank South African bid, preserves old work, and opens the same bid on a repeat import', async ({ page }) => {
  await mockSource(page); await page.goto('/tenders');
  await page.getByRole('button', { name: 'Solar installation project 1', exact: true }).click();
  await page.getByRole('button', { name: 'Create bid workspace', exact: true }).click();
  await expect(page).toHaveURL(/\/#bid-studio/);
  await expect(page.getByRole('region', { name: 'Bid studio', exact: true })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Solar installation project 1', exact: true })).toBeVisible();
  let tenders = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), TENDER_STORAGE_KEY);
  expect(tenders).toHaveLength(4); expect(tenders[0].clauses).toEqual([]); expect(tenders[0].executiveSummary).toBe(''); expect(tenders[0].source.noticeId).toBe('1001');
  const id = tenders[0].id;
  await page.evaluate((key) => { const data = JSON.parse(localStorage.getItem(key) || '[]'); data[0].executiveSummary = 'Our reviewed proposal'; localStorage.setItem(key, JSON.stringify(data)); }, TENDER_STORAGE_KEY);
  await page.goto('/tenders');
  await page.getByRole('button', { name: 'Solar installation project 1', exact: true }).click();
  await page.getByRole('button', { name: 'Create bid workspace', exact: true }).click();
  await expect(page).toHaveURL(/\/#bid-studio/);
  tenders = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), TENDER_STORAGE_KEY);
  expect(tenders).toHaveLength(4); expect(tenders[0].id).toBe(id); expect(tenders[0].executiveSummary).toBe('Our reviewed proposal');
});

test('a failed refresh keeps the last successful matching results with an explicit cached label', async ({ page }) => {
  let unavailable = false;
  await mockSource(page, () => unavailable); await page.goto('/tenders?q=solar');
  await expect(page.getByRole('article')).toHaveCount(12);
  unavailable = true;
  await page.getByRole('button', { name: 'Refresh tender results', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Showing the last successful results' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(12);
  await expect(page.getByText('Cached source results', { exact: false })).toBeVisible();
  await page.reload(); await expect(page.getByRole('article')).toHaveCount(12);
  await expect(page.getByRole('alert').filter({ hasText: 'Showing the last successful results' })).toBeVisible();
});

test('the saved view includes saved information notices and does not depend on a source connection', async ({ page }) => {
  await page.addInitScript(({ key, notice }) => localStorage.setItem(key, JSON.stringify([{ notice, savedAt: new Date().toISOString() }])), { key: SAVED_TENDERS_KEY, notice: { ...notices[0], noticeKind: 'information' } });
  await mockSource(page, () => true); await page.goto('/tenders?view=saved');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Information request');
});

test('an import never overwrites invalid existing workspace data', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'important existing data'), TENDER_STORAGE_KEY);
  await mockSource(page); await page.goto('/tenders');
  await page.getByRole('button', { name: 'Solar installation project 1', exact: true }).click();
  await page.getByRole('button', { name: 'Create bid workspace', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Saved workspace data needs recovery. Open your workspace before importing a tender.', { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), TENDER_STORAGE_KEY)).toBe('important existing data');
});

test('empty, source-error, and storage-error states give useful actions without claiming success', async ({ page }) => {
  await mockSource(page); await page.goto('/tenders?q=no-such-tender');
  await expect(page.getByRole('heading', { name: 'No tenders match these filters.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(12);
  await page.evaluate((key) => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Storage full', 'QuotaExceededError'); return original.call(this, name, value); }; }, SAVED_TENDERS_KEY);
  await page.getByRole('button', { name: 'Save tender ZA-1/2026', exact: true }).click();
  await expect(page.getByText('Browser storage is unavailable or full. Your saved tenders have not been changed.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save tender ZA-1/2026', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('mobile filters, dialog keyboard handling, dark theme and reduced motion fit narrow screens', async ({ page }) => {
  await mockSource(page); await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tenders'); await expect(page.getByRole('article')).toHaveCount(12);
  await expect(page.getByLabel('Province', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Province', { exact: true }).selectOption('Western Cape');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page.getByRole('article').first()).toContainText('Western Cape');
  await expect(page.getByLabel('Province', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.keyboard.press('Escape');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const open = page.getByRole('button', { name: 'Solar installation project 13', exact: true });
  await open.click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeHidden();
  await expect(open).toBeFocused(); expect(errors).toEqual([]);
});
