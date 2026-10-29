import { expect, test } from "@playwright/test";
import { INITIAL_TENDERS } from "@/lib/initial-data";
import {
  ACCOUNT_TRANSFER_FORMAT,
  createAccountTransferBackup,
  inspectAccountTransferBackup,
  previewAccountTransfer,
} from "@/lib/account-transfer";

test("local account backup round-trips validated projects without contacting an account server", () => {
  const project = structuredClone(INITIAL_TENDERS[0]);
  const preview = previewAccountTransfer(JSON.stringify([project]));
  expect(preview.status).toBe("ready");
  if (preview.status !== "ready") return;
  const json = createAccountTransferBackup(preview.projects, new Date("2026-10-29T12:00:00Z"));
  const parsed = JSON.parse(json);
  expect(parsed.format).toBe(ACCOUNT_TRANSFER_FORMAT);
  expect(parsed.includesCloudAccount).toBe(false);
  expect(parsed.exportedAt).toBe("2026-10-29T12:00:00.000Z");
  const verified = inspectAccountTransferBackup(json);
  expect(verified.status).toBe("ready");
  if (verified.status === "ready") expect(verified.projects).toEqual([project]);
});

test("refuses invalid, duplicate, truncated or oversized data instead of silently dropping bids", () => {
  const project = structuredClone(INITIAL_TENDERS[0]);
  expect(previewAccountTransfer(null).status).toBe("empty");
  expect(previewAccountTransfer("{not json").status).toBe("invalid");
  expect(previewAccountTransfer(JSON.stringify([project, project])).status).toBe("invalid");
  expect(previewAccountTransfer(JSON.stringify([project, { id: "partial" }])).status).toBe(
    "invalid",
  );
  expect(previewAccountTransfer("x".repeat(5 * 1024 * 1024 + 1)).status).toBe("invalid");
});

test("untrusted imported backup metadata cannot masquerade as a versioned transfer", () => {
  const project = structuredClone(INITIAL_TENDERS[0]);
  const valid = JSON.parse(createAccountTransferBackup([project]));
  for (const modified of [
    { ...valid, format: "unknown" },
    { ...valid, version: 99 },
    { ...valid, includesCloudAccount: true },
    { ...valid, projects: [{ id: "not-a-valid-bid" }] },
  ]) {
    expect(inspectAccountTransferBackup(JSON.stringify(modified)).status).toBe("invalid");
  }
});
