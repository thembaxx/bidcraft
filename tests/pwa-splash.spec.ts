import { test, expect } from '@playwright/test';

test('installed iOS PWAs receive device-specific light and dark startup links', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('rel="apple-touch-startup-image"');
  expect(html).toContain('prefers-color-scheme: dark');
  expect(html).toContain('prefers-color-scheme: light');
  expect(html).toContain('device-width: 390px');
  expect(html).toContain('device-width: 834px');

  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.background_color).toBe('#F8F6EF');
  expect(manifest.theme_color).toBe('#101714');
});

test('launch images render as PNG at exact iPhone sizes', async ({ request }) => {
  for (const mode of ['light', 'dark']) {
    const image = await request.get(`/pwa/splash?width=1170&height=2532&mode=${mode}`);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
    expect(image.headers()['cache-control']).toContain('max-age=86400');

    const png = await image.body();
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(1170);
    expect(png.readUInt32BE(20)).toBe(2532);
  }
  expect((await request.get('/pwa/splash?width=9999&height=9999&mode=light')).status()).toBe(400);
  expect((await request.get('/pwa/splash?width=1170&height=2532&mode=unknown')).status()).toBe(400);
});
