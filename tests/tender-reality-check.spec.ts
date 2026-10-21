import { expect, test } from '@playwright/test';
import { DISCOVERY_HOME, type TenderDetail, type TenderNotice } from '../lib/discovery/types';
import { emptyCheck, evaluateRealityCheck, sourceChanges, sourceFingerprint } from '../lib/suitability/model';

const notice: TenderNotice = {
  id: '1001', reference: 'DEMO-MP-2026/17', title: 'ICT support services', buyer: 'Example municipality',
  province: 'Mpumalanga', category: 'IT', procurementType: 'RFQ', sourceStatus: 'Published',
  publishedAt: '2026-10-21T09:00:00+02:00', closesAt: '2026-11-21T12:00:00+02:00',
  briefing: 'required', briefingAt: '2026-11-01T09:00:00+02:00',
  documentCount: 1, noticeKind: 'opportunity', sourceUrl: DISCOVERY_HOME,
};
const tenderDocument = { id: 'doc-1', title: 'ICT Tender Pack.pdf', url: 'https://www.etenders.gov.za/home/Download?blobName=demo.pdf' };
const detail: TenderDetail = {
  ...notice, description: notice.title, conditions: 'See the compulsory briefing and attached documents.',
  delivery: 'Mpumalanga', briefingVenue: 'Municipal hall', checkedAt: new Date().toISOString(),
  documents: [tenderDocument], ocid: null, ocdsUrl: null, ocdsChecked: false, deadlineConflict: false,
};

test('assessment rules distinguish missing sources, self-report, blockers and reviewed potential fit', () => {
  const base = emptyCheck(notice.id);
  expect(evaluateRealityCheck(notice, null, base, false).state).toBe('insufficient_source_information');
  expect(evaluateRealityCheck(notice, detail, base, true).state).toBe('insufficient_source_information');
  const no = { ...base, packReviewed: true, answers: { briefing: 'no' as const } };
  expect(evaluateRealityCheck(notice, detail, no, true).state).toBe('potential_blocker');
  expect(evaluateRealityCheck(notice, detail, no, false).state).toBe('insufficient_source_information');
  const yes = { ...base, packReviewed: true, answers: { briefing: 'yes' as const } };
  expect(evaluateRealityCheck(notice, detail, yes, true).state).toBe('insufficient_source_information');
  const reviewed = { ...yes, reviewed: { briefing: true } };
  // A checked briefing is not a substitute for the complete tender pack.
  expect(evaluateRealityCheck(notice, detail, reviewed, true).state).toBe('insufficient_source_information');
  expect(evaluateRealityCheck(notice, { ...detail, documents: [] }, reviewed, true).state).toBe('insufficient_source_information');
  expect(evaluateRealityCheck(notice, { ...detail, deadlineConflict: true }, reviewed, true).state).toBe('insufficient_source_information');
  const stale = { ...reviewed, sourceFingerprint: sourceFingerprint(detail) };
  expect(evaluateRealityCheck(notice, { ...detail, closesAt: '2026-11-22T12:00:00+02:00' }, stale, true).state).toBe('insufficient_source_information');
  expect(sourceChanges(detail, { ...detail, documents: [tenderDocument, { id: 'doc-2', title: 'Addendum.pdf', url: tenderDocument.url }] })).toContain('Linked document listing changed; review attachments');
});

test('unverified clauses cannot silently become eligibility passes; preferences never automatically block', () => {
  const base = { ...emptyCheck(notice.id), packReviewed: true, answers: { briefing: 'yes' as const }, reviewed: { briefing: true } };
  const recorded = {
    id: 'manual-12345678-1234-1234-1234-123456789abc', label: 'Supplier declaration', kind: 'mandatory' as const,
    excerpt: 'A signed declaration is required.', sourceUrl: DISCOVERY_HOME, page: '4', createdAt: new Date().toISOString(),
  };
  const unchecked = { ...base, manualRequirements: [recorded] };
  expect(evaluateRealityCheck(notice, detail, unchecked, true).state).toBe('needs_confirmation');
  const allYes = { ...unchecked, answers: { ...base.answers, [recorded.id]: 'yes' as const }, reviewed: { ...base.reviewed, [recorded.id]: true } };
  expect(evaluateRealityCheck(notice, detail, allYes, true).state).toBe('potential_fit');
  const preference = { ...recorded, id: 'manual-12345678-1234-1234-1234-123456789abd', kind: 'evaluation' as const, label: 'Specific goals claim' };
  const withPreference = { ...allYes, manualRequirements: [recorded, preference], answers: { ...allYes.answers, [preference.id]: 'no' as const } };
  expect(evaluateRealityCheck(notice, detail, withPreference, true).state).toBe('potential_fit');
  const malformed = { ...recorded, sourceUrl: 'https://www.etenders.gov.za.evil.example/tenders' };
  expect(evaluateRealityCheck(notice, detail, { ...allYes, manualRequirements: [malformed] }, true).state).toBe('insufficient_source_information');
});

test('mobile reality checker supports self-report, source warning and actionable plan', async ({ page }) => {
  let current = detail;
  await page.route('**/api/tenders/1001', route => route.fulfill({ json: current }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tenders/check/1001');
  await expect(page.getByRole('heading', { name: 'Should you bid?' })).toBeVisible();
  await expect(page.getByText('ICT support services')).toBeVisible();
  await page.getByRole('button', { name: 'Run suitability check' }).click();
  await expect(page.getByRole('heading', { name: 'Insufficient source information' })).toBeVisible();
  await page.getByRole('button', { name: 'Requirements', exact: true }).click();
  await page.getByText('Attend the compulsory briefing').click();
  await page.getByLabel('Answer for Attend the compulsory briefing').selectOption('no');
  await page.getByRole('checkbox', { name: /I personally reviewed the original tender pack/ }).check();
  await page.getByRole('button', { name: 'Update Reality Check' }).click();
  await expect(page.getByRole('heading', { name: 'Potential blocker' })).toBeVisible();
  await page.getByRole('button', { name: 'Requirements', exact: true }).click();
  await page.getByText('Attend the compulsory briefing').click();
  await page.getByLabel('Answer for Attend the compulsory briefing').selectOption('yes');
  await page.getByRole('checkbox', { name: /I personally checked supporting evidence/ }).check();
  await page.getByRole('button', { name: 'Update Reality Check' }).click();
  await expect(page.getByRole('heading', { name: 'Insufficient source information' })).toBeVisible();
  await page.getByRole('button', { name: 'Requirements', exact: true }).click();
  await page.getByRole('textbox', { name: 'Requirement title' }).fill('Signed supplier declaration');
  await page.getByRole('textbox', { name: 'Exact source excerpt' }).fill('A signed supplier declaration must be provided with the tender.');
  await page.getByRole('textbox', { name: 'Official eTender document or listing URL' }).fill(tenderDocument.url);
  await page.getByRole('button', { name: 'Add sourced requirement' }).click();
  await page.locator('summary').filter({ hasText: 'Signed supplier declaration' }).click();
  await page.getByLabel('Answer for Signed supplier declaration').selectOption('yes');
  await page.getByRole('checkbox', { name: /I personally checked supporting evidence/ }).last().check();
  await page.getByRole('checkbox', { name: /I personally reviewed the original tender pack/ }).check();
  await page.getByRole('button', { name: 'Update Reality Check' }).click();
  await expect(page.getByRole('heading', { name: 'Potential fit' })).toBeVisible();
  await page.getByRole('button', { name: 'Action plan', exact: true }).click();
  await expect(page.getByText('Your preparation plan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export checklist (.md)' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  current = { ...detail, closesAt: '2026-11-25T15:00:00+02:00' };
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'Source information changed' })).toBeVisible();
  await expect(page.getByText('Closing date or time changed')).toBeVisible();
});

test('source unavailable keeps conservative state even for a saved supplier answer', async ({ page }) => {
  await page.route('**/api/tenders/1001', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.goto('/tenders/check/1001');
  await expect(page.getByText(/Live source refresh unavailable/)).toBeVisible();
  await page.getByRole('button', { name: 'Run suitability check' }).click();
  await expect(page.getByRole('heading', { name: 'Insufficient source information' })).toBeVisible();
});
