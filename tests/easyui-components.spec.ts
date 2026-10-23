import { expect, test } from "@playwright/test";

test("EasyUI FAQ is keyboard-accessible and keeps data limitations discoverable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  const storage = page.getByRole("button", { name: "Where are my proposals stored?" });
  await expect(storage).toHaveAttribute("aria-expanded", "true");
  const offline = page.getByRole("button", { name: "What can I do offline?" });
  await offline.focus();
  await page.keyboard.press("Enter");
  await expect(offline).toHaveAttribute("aria-expanded", "true");
  await expect(storage).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("searchbox", { name: "Search common questions" }).fill("eligibility");
  await expect(
    page.getByRole("button", { name: "Does a compliance score guarantee eligibility?" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "What can I do offline?" })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Does a compliance score guarantee eligibility?" })
    .click();
  await expect(page.getByText(/not verified compliance/)).toBeVisible();
});

test("EasyUI Today metrics render without overflow under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/today");
  await expect(page.getByLabel("Saved opportunities: 0")).toBeVisible();
  await expect(page.getByLabel("My active bids: 0")).toBeVisible();
  await expect(page.getByLabel("Due within 7 days: 0")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
