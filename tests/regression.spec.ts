import { test, expect } from "@playwright/test";
import { INITIAL_TENDERS, INITIAL_VAULT_DOCS } from "../lib/initial-data";
import { commitProposal, restoreProposal } from "../lib/proposals";
import { isTender } from "../lib/validation";
import { rankVaultDocuments } from "../lib/search";
const storageKey = "quora_bid_architect_tenders_v1";

test("snapshots preserve empty content, flags, score and monotonic version numbers", () => {
  const original = structuredClone(INITIAL_TENDERS[0]);
  const blank = commitProposal(
    original,
    { clauses: [], executiveSummary: "", discrepancies: [], leadScore: 0 },
    "Manual Edit",
    "Empty checkpoint",
  );
  const edited = commitProposal(
    blank,
    {
      clauses: original.clauses,
      executiveSummary: "Changed",
      discrepancies: original.discrepancies,
    },
    "Manual Edit",
    "Edit",
  );
  const restored = restoreProposal(edited, blank.versions[0]);
  expect(restored.clauses).toEqual([]);
  expect(restored.executiveSummary).toBe("");
  expect(restored.discrepancies).toEqual([]);
  expect(restored.leadScore).toBe(0);
  expect(restored.versions[0].versionNumber).toBe("v1.6");
  expect(original.versions).toHaveLength(3);
  const firstNhsEdit = commitProposal(
    structuredClone(INITIAL_TENDERS[1]),
    {},
    "Manual Edit",
    "Checkpoint",
  );
  expect(firstNhsEdit.versions[0].versionNumber).toBe("v1.1");
  expect(isTender({ ...original, clauses: [{}] })).toBe(false);
  expect(isTender(original)).toBe(true);
});

test("local search ranks matching evidence without fabricated minimum scores", () => {
  const ranked = rankVaultDocuments("financial turnover liquidity audited", INITIAL_VAULT_DOCS);
  expect(ranked[0].id).toBe("vault-za-fin-audit-2025");
  expect(
    rankVaultDocuments("", INITIAL_VAULT_DOCS).every((item) => item.similarityScore === 0),
  ).toBe(true);
});

test("API rejects bad requests and local search works without an AI key", async ({ request }) => {
  expect(
    (
      await request.post("/api/tender-ai", {
        data: "bad json",
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await request.post("/api/tender-ai", { data: { action: "unknown", payload: {} } })).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/tender-ai", {
        data: { action: "draft_clause", payload: { clause: {}, vaultDocs: [] } },
      })
    ).status(),
  ).toBe(400);
  const response = await request.post("/api/tender-ai", {
    data: {
      action: "vector_search",
      payload: { query: "audited turnover liquidity", vaultDocs: INITIAL_VAULT_DOCS },
    },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).result.ranked[0].id).toBe("vault-za-fin-audit-2025");
  expect((await request.get("/api/pwa-icon?size=oops")).status()).toBe(400);
});

test("new bids start blank and persist after reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New Bid", exact: true }).click();
  await page.getByLabel("Tender Title", { exact: true }).fill("Clean water procurement");
  await page.getByRole("button", { name: "Create workspace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Clean water procurement", exact: true }),
  ).toBeVisible();
  const created = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(created.clauses).toEqual([]);
  expect(created.versions).toEqual([]);
  expect(created.discrepancies).toEqual([]);
  expect(created.executiveSummary).toBe("");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Clean water procurement", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Clause comparison" }).click();
  await expect(
    page.getByText("Import tender requirements from Compliance & vault to start comparing."),
  ).toBeVisible();
});

test("failed AI operations preserve drafts and report the failure", async ({ page }) => {
  await page.route("**/api/tender-ai", (route) =>
    route.fulfill({ status: 503, json: { error: "AI temporarily unavailable" } }),
  );
  await page.goto("/");
  await page.getByRole("tab", { name: "Clause comparison" }).click();
  const before = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  await page.getByRole("button", { name: "AI Auto-Align Clause", exact: true }).first().click();
  await expect(page.getByText("AI temporarily unavailable", { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before);
  await page.getByRole("tab", { name: "Compliance & vault" }).click();
  await page.getByRole("button", { name: "Check Compliance", exact: true }).click();
  await expect(page.getByRole("button", { name: "Re-Scan Proposal Compliance" })).toBeEnabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before);
});

test("manual editing works in overlay mode and requires a new review", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Clause comparison" }).click();
  await page.getByRole("button", { name: "Unified Overlay Diff" }).click();
  await page.getByRole("button", { name: "Manual Edit", exact: true }).first().click();
  await page
    .getByRole("textbox", { name: "Edit response for SEC-4.1" })
    .fill("Updated response for human review.");
  await page.getByRole("button", { name: "Commit Version", exact: true }).click();
  await expect(page.getByText("Updated response for human review.").first()).toBeVisible();
  const tender = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(tender.clauses[0].complianceStatus).toBe("partial");
  expect(tender.clauses[0].confidenceScore).toBe(0);
  expect(tender.versions).toHaveLength(4);
});

test("invalid saved data does not crash the workspace", async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, JSON.stringify([{ id: "broken" }])),
    storageKey,
  );
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: INITIAL_TENDERS[0].title, exact: true }),
  ).toBeVisible();
});

test("branding, SEO and LLM context are consistent and server rendered", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("Make every");
  expect(html).toContain("Bidcraft — AI Tender");
  expect(html).not.toContain("quora-bid-architect.app");
  expect(html).toContain('lang="en-ZA"');
  expect(html).toContain('content="en_ZA"');
  expect(html).toContain("Built for South African bid teams");
  expect(await (await request.get("/about")).text()).toContain("A more considered way to bid");
  expect(await (await request.get("/llm.txt")).text()).toBe(
    await (await request.get("/llms.txt")).text(),
  );
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.short_name).toBe("Bidcraft");
  expect(manifest.icons[0].type).toBe("image/png");
  expect(manifest.lang).toBe("en-ZA");
  expect(manifest.name).toContain("South Africa");
  expect((await request.get("/brand/social-card.png")).headers()["content-type"]).toContain(
    "image/png",
  );
});

test("mobile navigation, keyboard tabs and layout support reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const stages = page.getByRole("group", { name: "Bid preparation steps" });
  await expect(stages.getByRole("button", { name: "Understand" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await stages.getByRole("button", { name: "Review" }).click();
  await expect(stages.getByRole("button", { name: "Review" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("navigation", { name: "Main mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My bids", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("zero-score audits clear previous flags and create an audit snapshot", async ({ page }) => {
  await page.route("**/api/tender-ai", (route) =>
    route.fulfill({
      json: {
        result: {
          overallComplianceScore: 0,
          grade: "Needs review",
          auditSummary: "Review required.",
          discrepancies: [],
        },
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Check Compliance", exact: true }).click();
  await expect(
    page.getByText("AI audit complete: 0% (Needs review).", { exact: true }),
  ).toBeVisible();
  const tender = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(tender.leadScore).toBe(0);
  expect(tender.discrepancies).toEqual([]);
  expect(tender.versions[0].triggerType).toBe("AI Compliance Audit");
});

test("production service worker reopens cached workspace offline", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
  await context.setOffline(false);
});
