import { test, expect } from "@playwright/test";
import { SAVED_TENDERS_KEY, DISCOVERY_HOME, type TenderNotice } from "../lib/discovery/types";

test("Today prioritises saved deadlines without inventing persistent alerts", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-21T08:00:00Z"));
  const notice: TenderNotice = {
    id: "178001",
    reference: "ICT-2026-01",
    title: "Municipal website development and hosting",
    buyer: "Example Municipality",
    province: "Mpumalanga",
    category: "Services",
    procurementType: "Request for Bid",
    sourceStatus: "",
    publishedAt: "2026-10-20T08:00:00+02:00",
    closesAt: "2026-10-24T11:00:00+02:00",
    briefing: "required",
    briefingAt: "2026-10-22T10:00:00+02:00",
    documentCount: 1,
    noticeKind: "opportunity",
    sourceUrl: DISCOVERY_HOME,
  };
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(
        key,
        JSON.stringify([{ notice: value, savedAt: "2026-10-21T08:00:00Z" }]),
      );
    },
    { key: SAVED_TENDERS_KEY, value: notice },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: /A clearer way forward/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs your attention" })).toBeVisible();
  await expect(page.getByRole("heading", { name: notice.title })).toBeVisible();
  await expect(page.getByText("Compulsory briefing: verify attendance")).toBeVisible();
  await expect(page.getByText(/does not send background email or push alerts/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main mobile navigation" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("mobile bid editing uses one app nav and reveals advanced tools on demand", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#bid-studio");
  const nav = page.getByRole("navigation", { name: "Main mobile navigation" });
  await expect(nav.getByRole("link", { name: "My bids" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Current bid")).toBeVisible();
  const steps = page.getByRole("group", { name: "Bid preparation steps" });
  await expect(steps.getByRole("button", { name: "Understand" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await steps.getByRole("button", { name: "Prepare" }).click();
  await expect(steps.getByRole("button", { name: "Prepare" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByText("More bid tools").click();
  await page.getByRole("button", { name: "Compare clauses" }).last().click();
  await expect(page.getByText("More bid tools")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
