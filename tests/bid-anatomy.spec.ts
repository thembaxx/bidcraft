import { test, expect, type Page } from "@playwright/test";
import { INITIAL_TENDERS, INITIAL_VAULT_DOCS } from "../lib/initial-data";
import { inspectionSummary, inspectionState, recordClauseReview } from "../lib/bid-anatomy";
import { restoreProposal } from "../lib/proposals";
import { isTender } from "../lib/validation";
const storageKey = "quora_bid_architect_tenders_v1";
const openAnatomy = async (page: Page) => {
  await page.getByRole("tab", { name: "Bid Anatomy", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bid Anatomy", exact: true })).toBeVisible();
};

test("Anatomy distinguishes AI alignment, human approval, flags and missing evidence", () => {
  const tender = structuredClone(INITIAL_TENDERS[0]);
  expect(inspectionSummary(tender, INITIAL_VAULT_DOCS)).toMatchObject({
    total: 4,
    mandatory: 4,
    reviewedMandatory: 0,
    awaitingReview: 4,
    openFlags: 2,
    mandatoryProgress: 0,
  });
  expect(inspectionState(tender.clauses[0], INITIAL_VAULT_DOCS, [])).toBe("awaiting-review");
  expect(() =>
    recordClauseReview(tender, "cl-103", INITIAL_VAULT_DOCS, "approved", "Checked"),
  ).toThrow("Resolve the recorded flags");
  expect(() => recordClauseReview(tender, "cl-101", [], "approved", "Checked")).toThrow(
    "Link available evidence",
  );
  expect(() =>
    recordClauseReview(tender, "cl-101", INITIAL_VAULT_DOCS, "changes-requested", ""),
  ).toThrow("Describe the changes");
  const reviewed = recordClauseReview(
    tender,
    "cl-101",
    INITIAL_VAULT_DOCS,
    "approved",
    "Reviewed against original sources.",
  );
  expect(inspectionSummary(reviewed, INITIAL_VAULT_DOCS).reviewedMandatory).toBe(1);
  expect(reviewed.leadScore).toBe(tender.leadScore);
  expect(reviewed.clauses[0].confidenceScore).toBe(98);
  expect(reviewed.versions[0].triggerType).toBe("Human Review");
  expect(reviewed.versions[0].author).toBe("Local reviewer");
  expect(isTender(reviewed)).toBe(true);
  expect(tender.clauses[0].review).toBeUndefined();
  const changes = recordClauseReview(
    reviewed,
    "cl-101",
    INITIAL_VAULT_DOCS,
    "changes-requested",
    "Clarify the hosting location.",
  );
  expect(inspectionState(changes.clauses[0], INITIAL_VAULT_DOCS, changes.discrepancies)).toBe(
    "needs-review",
  );
  expect(restoreProposal(changes, reviewed.versions[0]).clauses[0].review?.outcome).toBe(
    "approved",
  );
});

test("inspection pins open real requirements and source evidence", async ({ page }) => {
  await page.goto("/");
  await openAnatomy(page);
  await expect(page.getByRole("article", { name: "Clause inspector for LEG-7.2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve reviewed response" })).toBeDisabled();
  await page
    .getByRole("button", { name: "Inspect SEC-4.1: Awaiting human review", exact: true })
    .click();
  const inspector = page.getByRole("article", { name: "Clause inspector for SEC-4.1" });
  await expect(inspector).toContainText(INITIAL_TENDERS[0].clauses[0].originalText);
  await inspector.locator("details.anatomy-evidence > summary").click();
  await expect(inspector.getByText(INITIAL_VAULT_DOCS[0].fullText, { exact: true })).toBeVisible();
  const pin = page.getByRole("button", {
    name: "Inspect SEC-4.1: Awaiting human review",
    exact: true,
  });
  await pin.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("article", { name: "Clause inspector for TEC-2.3" })).toBeVisible();
});

test("human review persists, creates a snapshot, and is invalidated by a response edit", async ({
  page,
}) => {
  await page.goto("/");
  await openAnatomy(page);
  await page
    .getByRole("button", { name: "Inspect SEC-4.1: Awaiting human review", exact: true })
    .click();
  await page.getByLabel("I checked the requirement, response, and linked evidence.").check();
  await page.getByRole("button", { name: "Approve reviewed response" }).click();
  await expect(
    page.getByRole("button", { name: "Inspect SEC-4.1: Human reviewed", exact: true }),
  ).toBeVisible();
  let tender = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(tender.clauses[0].review.outcome).toBe("approved");
  expect(tender.versions[0].triggerType).toBe("Human Review");
  await page.reload();
  await openAnatomy(page);
  await page.getByRole("button", { name: "Inspect SEC-4.1: Human reviewed", exact: true }).click();
  await expect(page.getByText("Human approval recorded", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit in comparison →", exact: true }).click();
  const card = page.locator("#clause-card-cl-101");
  await card.getByRole("button", { name: "Manual Edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Edit response for SEC-4.1" })
    .fill("Revised proposal wording requiring a fresh review.");
  await page.getByRole("button", { name: "Commit Version", exact: true }).click();
  await openAnatomy(page);
  tender = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(tender.clauses[0].review).toBeUndefined();
  await expect(
    page.getByRole("button", { name: "Inspect SEC-4.1: Needs changes or review", exact: true }),
  ).toBeVisible();
});

test("evidence changes invalidate approval and missing evidence blocks approval", async ({
  page,
}) => {
  await page.goto("/");
  await openAnatomy(page);
  await page
    .getByRole("button", { name: "Inspect SEC-4.1: Awaiting human review", exact: true })
    .click();
  await page.getByLabel("I checked the requirement, response, and linked evidence.").check();
  await page.getByRole("button", { name: "Approve reviewed response" }).click();
  await page.getByText("Manage evidence links", { exact: true }).click();
  await page
    .getByRole("group", { name: "Evidence linked to SEC-4.1" })
    .getByRole("checkbox")
    .first()
    .uncheck();
  await expect(
    page.getByRole("button", { name: "Inspect SEC-4.1: Evidence missing", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve reviewed response" })).toBeDisabled();
  const tender = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]")[0],
    storageKey,
  );
  expect(tender.clauses[0].review).toBeUndefined();
  expect(tender.clauses[0].matchedVaultDocIds).toEqual([]);
});

test("review notes record requested changes and are visible in version history", async ({
  page,
}) => {
  await page.goto("/");
  await openAnatomy(page);
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Describe the changes needed." }),
  ).toBeVisible();
  await page
    .getByLabel("Review note", { exact: true })
    .fill("Update the insurance limits and attach current evidence.");
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  await expect(page.getByText("Changes requested", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText("Human Review", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Local reviewer", { exact: true }).first()).toBeVisible();
  await expect(
    page
      .getByText("Update the insurance limits and attach current evidence.", { exact: true })
      .first(),
  ).toBeVisible();
});

test("large tenders page through six real stations without losing clauses", async ({ page }) => {
  const tender = structuredClone(INITIAL_TENDERS[0]);
  tender.discrepancies = [];
  tender.clauses = Array.from({ length: 8 }, (_, index) => ({
    ...tender.clauses[0],
    id: `cl-${index}`,
    code: `REQ-${index + 1}`,
    title: `Requirement ${index + 1}`,
  }));
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify([value])), {
    key: storageKey,
    value: tender,
  });
  await page.goto("/");
  await openAnatomy(page);
  await expect(
    page.getByRole("group", { name: "Requirements on this bench" }).getByRole("button"),
  ).toHaveCount(6);
  await page.getByRole("button", { name: "Next inspection stations" }).click();
  await expect(
    page.getByRole("group", { name: "Requirements on this bench" }).getByRole("button"),
  ).toHaveCount(2);
  await expect(page.getByRole("article", { name: "Clause inspector for REQ-7" })).toBeVisible();
  await page
    .getByRole("button", { name: "Inspect REQ-7: Awaiting human review", exact: true })
    .focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("article", { name: "Clause inspector for REQ-8" })).toBeVisible();
  await page.getByRole("button", { name: "Inspect next unreviewed clause →", exact: true }).click();
  await expect(page.getByRole("article", { name: "Clause inspector for REQ-1" })).toBeVisible();
});

test("empty tenders show an import action and Anatomy fits mobile and desktop", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await openAnatomy(page);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "New Bid", exact: true }).click();
  await page.getByLabel("Tender Title", { exact: true }).fill("Empty Anatomy workspace");
  await page.getByRole("button", { name: "Create workspace", exact: true }).click();
  await openAnatomy(page);
  await expect(
    page.getByText("The inspection bench is ready for your requirements.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import tender requirements →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vision OCR Scanned Tender Ingestion" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
