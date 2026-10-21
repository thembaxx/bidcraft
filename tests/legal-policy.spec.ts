import { test, expect } from '@playwright/test';

const policies = [
  { path: '/legal', title: 'Legal & transparency' },
  { path: '/privacy', title: 'Privacy notice' },
  { path: '/terms', title: 'Terms of use' },
  { path: '/data-sources', title: 'Data sources & reliability' },
  { path: '/ai-disclosure', title: 'AI & limitations' },
];

test('all policies render, are discoverable and do not invent operator details', async ({ page }) => {
  await page.goto('/privacy');
  const footer = page.getByRole('navigation', { name: 'Policies' }).last();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText(/browser.s localStorage/)).toBeVisible();
  await expect(page.getByText(/unpaid services/)).toBeVisible();
  for (const { path, title } of policies) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Bidcraft' })).toBeVisible();
  }
  await expect(page.getByText(/registration|operator/).first()).toBeVisible();
});

test('legal links are globally visible and procurement disclaimers remain explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/today');
  const footer = page.getByRole('contentinfo', { name: 'Legal and data transparency' });
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Data sources' })).toBeVisible();
  await expect(footer.getByText(/Not affiliated with government/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/data-sources');
  await expect(page.getByText(/not a full document-level validation/)).toBeVisible();
});

test('AI policy warns clearly about free-tier processing and human verification', async ({ page }) => {
  await page.goto('/ai-disclosure');
  await expect(page.getByText(/may involve human review/)).toBeVisible();
  await expect(page.getByText(/does not verify SARS, CSD/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the Google Gemini API terms' })).toHaveAttribute('href', 'https://ai.google.dev/gemini-api/terms');
});
