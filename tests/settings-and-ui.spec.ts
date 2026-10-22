import { expect, test } from '@playwright/test';

test('settings panel exposes secondary actions and closes using Escape', async ({ page }) => {
  await page.goto('/today');
  const trigger = page.getByRole('button', { name: 'Settings' });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings).toBeVisible();
  await expect(settings.getByRole('button', { name: 'System theme' })).toBeVisible();
  await expect(settings.getByRole('button', { name: 'Light theme' })).toBeVisible();
  await expect(settings.getByRole('button', { name: 'Dark theme' })).toBeVisible();
  await expect(settings.getByRole('link', { name: 'Privacy & data' })).toHaveAttribute('href', '/privacy');
  await expect(settings.getByRole('link', { name: 'Data sources' })).toHaveAttribute('href', '/data-sources');
  await expect(settings.getByRole('link', { name: 'Bidding guide' })).toHaveAttribute('href', '/about#sa-bidding-guide');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(settings).not.toBeVisible();
});

test('System follows OS, manual preferences persist across pages and reloads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/today');
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true');

  await settings.getByRole('button', { name: 'Light theme' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(settings.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/tenders?view=saved');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'System theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('mobile bid dropdown and plus action have matching 48px control bounds', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#workspace');
  const select = page.locator('#mobile-bid-switcher');
  const add = page.getByRole('button', { name: 'Create a new bid' });
  await expect(select).toBeVisible();
  await expect(add).toBeVisible();

  const selectBounds = await select.boundingBox();
  const addBounds = await add.boundingBox();
  expect(selectBounds).not.toBeNull();
  expect(addBounds).not.toBeNull();
  expect(selectBounds!.height).toBe(48);
  expect(addBounds!.height).toBe(48);
  expect(Math.abs(selectBounds!.y + selectBounds!.height - (addBounds!.y + addBounds!.height))).toBeLessThan(1);
  expect(addBounds!.width).toBe(48);

  await add.click();
  await expect(page.getByRole('dialog', { name: 'Ingest New Government or Corporate Tender' })).toBeVisible();
});

test('settings remains available in the main mobile headers', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['/today', '/tenders?view=saved', '/about', '/privacy']) {
    await page.goto(path);
    const header = page.locator('header').first();
    await expect(header.getByRole('button', { name: 'Settings' })).toBeVisible();
    const menu = header.getByRole('button', { name: 'Settings' });
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await page.keyboard.press('Escape');
  }
});
