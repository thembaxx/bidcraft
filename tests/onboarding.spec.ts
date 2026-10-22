import { test, expect } from '@playwright/test';

test.describe('new visitor onboarding', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('asks three relevant questions, then opens a prefilled tender search', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/today');
    const dialog = page.getByRole('dialog', { name: 'What brings you here?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await expect(dialog.getByRole('button', { name: /Continue/ })).toBeDisabled();

    await dialog.getByRole('button', { name: /Find tenders/ }).click();
    await dialog.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByRole('heading', { name: 'Where do you take on work?' })).toBeVisible();
    await page.getByRole('button', { name: 'Mpumalanga', exact: true }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByRole('heading', { name: 'What does your business offer?' })).toBeVisible();
    await page.getByRole('button', { name: 'Software', exact: true }).click();
    await page.getByRole('button', { name: 'Find my first tender' }).click();

    await expect(page).toHaveURL(/\/tenders\?/);
    await expect(page).toHaveURL(/province=Mpumalanga/);
    await expect(page).toHaveURL(/q=Software/);
    await expect(page.getByRole('dialog', { name: /What brings you here/ })).toHaveCount(0);
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem('bidcraft_onboarding_v1') || 'null'));
    expect(record).toMatchObject({ version: 1, status: 'completed', goal: 'discover', province: 'Mpumalanga', keyword: 'Software' });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
  });

  test('offers an optional interactive illustration without blocking progress or reduced-motion users', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/today');
    const dialog = page.getByRole('dialog', { name: 'What brings you here?' });
    await expect(dialog).toBeVisible();
    const sculpture = dialog.getByRole('button', { name: 'Turn the decorative bid documents' });
    await expect(sculpture).toBeVisible();
    await expect(sculpture).toHaveAttribute('data-scene-mode', 'fallback');
    await expect(sculpture.locator('canvas')).toHaveCount(0);
    await sculpture.click();
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');

    await dialog.getByRole('button', { name: /Find tenders/ }).click();
    await dialog.getByRole('button', { name: /Continue/ }).click();
    await dialog.getByRole('button', { name: 'Gauteng', exact: true }).click();
    await dialog.getByRole('button', { name: 'Previous question' }).click();
    await expect(dialog.getByRole('button', { name: /Find tenders/ })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: /Continue/ }).click();
    await expect(dialog.getByRole('button', { name: 'Gauteng', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('finishes the optional keyword step using Enter', async ({ page }) => {
    await page.goto('/today');
    const dialog = page.getByRole('dialog', { name: 'What brings you here?' });
    await dialog.getByRole('button', { name: /Find tenders/ }).click();
    await dialog.getByRole('button', { name: /Continue/ }).click();
    await dialog.getByRole('button', { name: /Continue/ }).click();
    await dialog.getByLabel('Service or product (optional)').fill('Website development');
    await dialog.getByLabel('Service or product (optional)').press('Enter');
    await expect(page).toHaveURL(/q=Website\+development/);
    await expect(dialog).toHaveCount(0);
  });

  test('can skip without losing access or seeing the tour again', async ({ page }) => {
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip onboarding' }).click();
    await expect(page.getByRole('heading', { name: 'A clearer way forward.' })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem('bidcraft_onboarding_v1') || 'null'));
    expect(record.status).toBe('skipped');
  });

  test('supports small screens, reduced motion and Escape to dismiss', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tenders?view=saved');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
  });
});

test('Settings can replay onboarding without erasing completed choices on close', async ({ page }) => {
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Replay onboarding' }).click();
  await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /A little of both/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Skip onboarding' }).click();
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('bidcraft_onboarding_v1') || 'null'));
  expect(record).toMatchObject({ status: 'completed', goal: 'both', province: 'Gauteng', keyword: 'Cleaning' });

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Replay onboarding' }).click();
  await page.getByRole('button', { name: /Prepare a bid/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page).toHaveURL(/#bid-studio$/);
  await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
  const updated = await page.evaluate(() => JSON.parse(localStorage.getItem('bidcraft_onboarding_v1') || 'null'));
  expect(updated.goal).toBe('prepare');
  expect(updated.status).toBe('completed');
});
