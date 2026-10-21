import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { formatRand, formatSouthAfricanDate } from '../lib/locale';
import { INITIAL_TENDERS } from '../lib/initial-data';

const storageKey = 'quora_bid_architect_tenders_v1';

test('South African date formatting handles UTC boundaries and legacy SAST snapshots', () => {
  expect(formatSouthAfricanDate('2026-10-21T23:30:00Z', true)).toMatch(/22 Oct 2026.*01:30/);
  expect(formatSouthAfricanDate('2026-10-21 23:30', true)).toMatch(/21 Oct 2026.*23:30/);
  expect(formatSouthAfricanDate('2026-10-21T23:30:00-07:00', true)).toMatch(/22 Oct 2026.*08:30/);
  expect(formatSouthAfricanDate('invalid', true)).toBe('Not published');
  expect(formatRand(850000.5).replace(/\s/g, ' ')).toBe('R 850 000,50');
});

test('a new South African bid preserves its reference and SAST deadline in another browser timezone', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, timezoneId: 'America/Los_Angeles', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage(); await page.goto('/');
    await page.getByRole('button', { name: 'Create a new bid', exact: true }).click();
    await page.getByLabel('Tender Title', { exact: true }).fill('Municipal water telemetry');
    await page.getByLabel('Issuing authority', { exact: true }).fill('City of Tshwane');
    await page.getByLabel('Contract budget', { exact: true }).fill('850 000,50');
    await page.getByLabel('Bid / tender reference (optional)', { exact: true }).fill('RFQ/2026/104');
    await page.getByLabel('Closing date & time · SAST (optional)', { exact: true }).fill('2026-12-01T09:30');
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Municipal water telemetry', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]')[0]?.rfpNumber, storageKey)).toBe('RFQ/2026/104');
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]')[0], storageKey);
    expect(saved.deadline).toMatch(/01 Dec 2026.*09:30 SAST/);
    expect(saved.budget).toBe(formatRand(850000.5)); expect(saved.clauses).toEqual([]); expect(saved.executiveSummary).toBe(''); expect(saved.isDemo).toBeUndefined();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Municipal water telemetry', exact: true })).toBeVisible();
    await expect(page.getByText(saved.deadline, { exact: true })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('More bid actions', { exact: true }).click();
    await page.getByRole('button', { name: 'Export proposal', exact: true }).click();
    const download = await downloadPromise;
    const markdown = await readFile((await download.path())!, 'utf8');
    expect(markdown).toContain('**Bid / Tender Reference:** RFQ/2026/104');
    expect(markdown).toContain(`**Closing date:** ${saved.deadline}`); expect(markdown).toContain(formatRand(850000.5));
    expect(markdown).not.toContain('Demonstration workspace');
  } finally { await context.close(); }
});

test('adding South African examples preserves legacy edits, currency and review history', async ({ page }) => {
  const legacy = { ...structuredClone(INITIAL_TENDERS[0]), id: 'tender-uk-grid-2026', isDemo: undefined, budget: '£12,345.67', deadline: '2026-11-14 17:00 GMT', executiveSummary: 'My saved proposal must stay intact.' };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify([value])), { key: storageKey, value: legacy });
  await page.goto('/');
  await expect(page.getByText('£12,345.67', { exact: true }).first()).toBeVisible();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]')[0], storageKey);
  await page.getByRole('button', { name: 'Add South African examples', exact: true }).click();
  await expect(page.getByText('DEMO-TSH-2026-884', { exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]').length, storageKey)).toBe(4);
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), storageKey);
  expect(after.find((item: { id: string }) => item.id === legacy.id)).toEqual(before);
  expect(after.filter((item: { isDemo: boolean }) => item.isDemo)).toHaveLength(3);
  await expect(page.getByRole('button', { name: 'Add South African examples', exact: true })).toBeHidden();
});

test('supplier guidance is conditional and review history stays in SAST outside South Africa', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, timezoneId: 'America/Los_Angeles', reducedMotion: 'reduce' });
  try {
    const page = await context.newPage(); await page.clock.setFixedTime(new Date('2026-10-21T23:30:00Z'));
    await page.goto('/');
    await page.getByRole('tab', { name: /^Compliance & vault/ }).click();
    await page.getByText('South African bidding guide', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Central Supplier Database', exact: false })).toHaveAttribute('href', 'https://secure.csd.gov.za/');
    await expect(page.getByRole('link', { name: 'SARS TCS guidance', exact: false })).toHaveAttribute('href', /sars.gov.za\/individuals\/manage-your-tax-compliance-status/);
    await expect(page.getByText(/Requirements vary by buyer and tender/)).toBeVisible();
    await page.getByRole('tab', { name: 'Bid Anatomy', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect SEC-4.1: Awaiting human review', exact: true }).click();
    await page.getByLabel('I checked the requirement, response, and linked evidence.').check();
    await page.getByRole('button', { name: 'Approve reviewed response', exact: true }).click();
    await expect(page.locator('.anatomy-last-review')).toContainText(/22 Oct 2026.*01:30 SAST/);
    await page.getByRole('tab', { name: /^History/ }).click();
    await expect(page.getByText(/22 Oct 2026.*01:30 SAST/).first()).toBeVisible();
  } finally { await context.close(); }
});
