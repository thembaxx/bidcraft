import { test, expect } from "@playwright/test";

test("Bidcraft launches standalone with a safe browser fallback", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
  });
  expect(manifest.start_url).toBe("/#workspace");
});

test("Bidcraft's startup HTML supports edge-to-edge installed views", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain("viewport-fit=cover");
});
