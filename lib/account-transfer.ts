import type { TenderProject } from "./types";
import { isRecord, isTender } from "./validation";

export const LOCAL_TENDERS_STORAGE_KEY = "quora_bid_architect_tenders_v1";
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const MAX_PROJECTS = 300;
export const ACCOUNT_TRANSFER_FORMAT = "bidcraft-local-account-transfer";

export type AccountTransferPreview =
  | { status: "empty"; projects: [] }
  | { status: "invalid"; reason: string; projects: [] }
  | { status: "ready"; projects: TenderProject[]; count: number };

export function previewAccountTransfer(raw: string | null): AccountTransferPreview {
  if (raw === null) return { status: "empty", projects: [] };
  if (raw.length > MAX_BACKUP_BYTES)
    return { status: "invalid", reason: "The local workspace is too large for a single transfer backup. Export important proposals separately.", projects: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "invalid", reason: "The saved workspace contains invalid JSON. Your browser data has not been changed.", projects: [] };
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_PROJECTS || !parsed.every(isTender)) {
    return { status: "invalid", reason: "The workspace has missing or invalid project records. Nothing was changed or skipped.", projects: [] };
  }
  const ids = new Set<string>();
  for (const project of parsed) {
    if (ids.has(project.id)) return { status: "invalid", reason: "Duplicate project IDs were found. Review the local workspace before transferring it.", projects: [] };
    ids.add(project.id);
  }
  return { status: "ready", projects: parsed, count: parsed.length };
}

export function createAccountTransferBackup(projects: TenderProject[], exportedAt = new Date()): string {
  const validated = previewAccountTransfer(JSON.stringify(projects));
  if (validated.status !== "ready") throw new Error("Only complete, validated local workspaces can be backed up.");
  return JSON.stringify({
    format: ACCOUNT_TRANSFER_FORMAT,
    version: 1,
    exportedAt: exportedAt.toISOString(),
    includesCloudAccount: false,
    projects: validated.projects,
  }, null, 2);
}

export function inspectAccountTransferBackup(raw: string) {
  if (raw.length > MAX_BACKUP_BYTES) return { status: "invalid" as const };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { return { status: "invalid" as const }; }
  if (!isRecord(parsed) || parsed.format !== ACCOUNT_TRANSFER_FORMAT || parsed.version !== 1
      || typeof parsed.exportedAt !== "string" || !Number.isFinite(Date.parse(parsed.exportedAt))
      || parsed.includesCloudAccount !== false || !Array.isArray(parsed.projects)) {
    return { status: "invalid" as const };
  }
  return previewAccountTransfer(JSON.stringify(parsed.projects));
}
