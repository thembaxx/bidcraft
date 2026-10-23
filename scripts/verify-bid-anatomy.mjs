import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { LINE_ENDS } from "../vendor/anatomy/line-ends.mjs";

const output = "test-results/anatomy-visual";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(process.env.BIDCRAFT_REVIEW_URL || "http://127.0.0.1:3000");
  await page.getByRole("tab", { name: "Bid Anatomy", exact: true }).click();
  await page
    .getByRole("group", { name: "Interactive bid inspection bench", exact: true })
    .waitFor();
  const bench = page.locator(".bid-bench .iso-plate");
  await bench.scrollIntoViewIfNeeded();
  for (const reviewed of [false, true]) {
    if (reviewed) {
      await page
        .getByRole("button", { name: "Inspect SEC-4.1: Awaiting human review", exact: true })
        .click();
      await page.getByLabel("I checked the requirement, response, and linked evidence.").check();
      await page.getByRole("button", { name: "Approve reviewed response" }).click();
      await page
        .getByRole("button", { name: "Inspect SEC-4.1: Human reviewed", exact: true })
        .waitFor();
      await bench.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200); // Capture the resting pose after the pin and gauge settle.
    }
    for (const theme of ["light", "dark"]) {
      if ((await page.locator(".bid-bench").getAttribute("data-theme")) !== theme)
        await page.getByRole("button", { name: "Toggle dark and light theme" }).click();
      await bench.scrollIntoViewIfNeeded();
      const result = await page.evaluate(`(${LINE_ENDS})({select: '.bid-bench .iso-plate'})`);
      console.log(
        JSON.stringify({
          theme,
          reviewed,
          lines: result.lines,
          ends: result.ends,
          problems: result.problems,
        }),
      );
      if (result.problems.length)
        throw new Error(
          `Unattached line ends in ${theme} ${reviewed ? "reviewed" : "initial"} pose`,
        );
      await bench.screenshot({
        path: `${output}/${theme}-${reviewed ? "reviewed" : "initial"}.png`,
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 950 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".bid-bench").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/phone.png` });
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (sideways || errors.length) throw new Error(JSON.stringify({ sideways, errors }));
  await page.setViewportSize({ width: 1440, height: 1100 });
  const box = await bench.boundingBox();
  const closeup = await context.newPage();
  await closeup.goto(process.env.BIDCRAFT_REVIEW_URL || "http://127.0.0.1:3000");
  await closeup.getByRole("tab", { name: "Bid Anatomy", exact: true }).click();
  await closeup.locator(".bid-bench .iso-plate").waitFor();
  // Detail screenshots are at four times CSS size to inspect every joint and stroke.
  await closeup.setViewportSize({ width: 1440, height: 1100 });
  const cdp = await context.newCDPSession(closeup);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 4,
    mobile: false,
  });
  for (const theme of ["light", "dark"]) {
    if ((await closeup.locator(".bid-bench").getAttribute("data-theme")) !== theme)
      await closeup.getByRole("button", { name: "Toggle dark and light theme" }).click();
    await closeup
      .locator(".bid-bench .iso-plate")
      .screenshot({ path: `${output}/${theme}-detail-4x.png` });
  }
  console.log(
    JSON.stringify({ status: "passed", output, figure: box, pageErrors: errors, sideways }),
  );
} finally {
  await browser.close();
}
