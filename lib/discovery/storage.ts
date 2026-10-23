import { INITIAL_TENDERS } from "@/lib/initial-data";
import { isRecord, isTender } from "@/lib/validation";
import type { TenderProject } from "@/lib/types";
import { createBidFromNotice, isOfficialUrl, isTenderNotice } from "./model";
import {
  SAVED_TENDERS_KEY,
  SELECTION_STORAGE_KEY,
  TENDER_STORAGE_KEY,
  type DiscoveryResponse,
  type SavedTender,
  type TenderDetail,
  type TenderNotice,
} from "./types";

const QUERY_CACHE_KEY = "bidcraft_discovery_cache_v1";
export function isDiscoveryResponse(value: unknown): value is DiscoveryResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.length <= 12 &&
    value.items.every(isTenderNotice) &&
    ["total", "page", "pageSize", "sourceTotal", "indexed"].every(
      (key) =>
        typeof value[key] === "number" && Number.isInteger(value[key]) && Number(value[key]) >= 0,
    ) &&
    Number(value.page) >= 1 &&
    Number(value.pageSize) >= 1 &&
    typeof value.complete === "boolean" &&
    typeof value.stale === "boolean" &&
    typeof value.checkedAt === "string" &&
    Number.isFinite(Date.parse(value.checkedAt)) &&
    isRecord(value.facets) &&
    ["provinces", "categories", "buyers", "types"].every(
      (key) =>
        Array.isArray((value.facets as Record<string, unknown>)[key]) &&
        ((value.facets as Record<string, unknown>)[key] as unknown[]).every(
          (item) => typeof item === "string",
        ),
    )
  );
}

export function readDiscoveryCache(): Record<string, DiscoveryResponse> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(QUERY_CACHE_KEY) || "{}");
    if (!isRecord(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw)
        .filter(([, value]) => isDiscoveryResponse(value))
        .slice(-3),
    ) as Record<string, DiscoveryResponse>;
  } catch {
    return {};
  }
}

export function rememberDiscovery(query: string, response: DiscoveryResponse) {
  try {
    localStorage.setItem(
      QUERY_CACHE_KEY,
      JSON.stringify(
        Object.fromEntries(
          Object.entries({ ...readDiscoveryCache(), [query]: response }).slice(-3),
        ),
      ),
    );
  } catch {
    /* Live search still works; explicit saved-tender failures are reported separately. */
  }
}

export function isTenderDetail(value: unknown): value is TenderDetail {
  return (
    isTenderNotice(value) &&
    isRecord(value) &&
    ["description", "conditions", "delivery", "briefingVenue", "checkedAt"].every(
      (key) => typeof value[key] === "string",
    ) &&
    Number.isFinite(Date.parse(value.checkedAt as string)) &&
    typeof value.deadlineConflict === "boolean" &&
    typeof value.ocdsChecked === "boolean" &&
    (value.ocid === null || typeof value.ocid === "string") &&
    (value.ocdsUrl === null ||
      (typeof value.ocdsUrl === "string" && isOfficialUrl(value.ocdsUrl))) &&
    Array.isArray(value.documents) &&
    value.documents.length <= 100 &&
    value.documents.every(
      (doc) =>
        isRecord(doc) &&
        typeof doc.id === "string" &&
        typeof doc.title === "string" &&
        typeof doc.url === "string" &&
        isOfficialUrl(doc.url),
    )
  );
}

export function readSavedOpportunities(): SavedTender[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SAVED_TENDERS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (value): value is SavedTender =>
          isRecord(value) &&
          isTenderNotice(value.notice) &&
          typeof value.savedAt === "string" &&
          Number.isFinite(Date.parse(value.savedAt)) &&
          (value.detail === undefined || isTenderDetail(value.detail)),
      )
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function writeSavedOpportunities(saved: SavedTender[]) {
  if (saved.length > 100)
    throw new Error(
      "You can save up to 100 tenders in this browser. Remove a saved tender to make room.",
    );
  try {
    localStorage.setItem(SAVED_TENDERS_KEY, JSON.stringify(saved));
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Your saved tenders have not been changed.",
    );
  }
}

export function importNoticeToWorkspace(notice: TenderNotice): {
  tender: TenderProject;
  existing: boolean;
} {
  let tenders: TenderProject[];
  const raw = localStorage.getItem(TENDER_STORAGE_KEY);
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        "Saved workspace data needs recovery. Open your workspace before importing a tender.",
      );
    }
    if (!Array.isArray(parsed) || !parsed.length || !parsed.every(isTender))
      throw new Error(
        "Saved workspace data needs recovery. Open your workspace before importing a tender.",
      );
    tenders = parsed;
  } else tenders = INITIAL_TENDERS;
  const existing = tenders.find(
    (item) =>
      item.source?.provider === "National Treasury eTender" && item.source.noticeId === notice.id,
  );
  const tender = existing ?? createBidFromNotice(notice);
  // Selection first: a storage failure must not claim a successful import or discard any old proposals.
  localStorage.setItem(SELECTION_STORAGE_KEY, tender.id);
  if (!existing) localStorage.setItem(TENDER_STORAGE_KEY, JSON.stringify([tender, ...tenders]));
  return { tender, existing: Boolean(existing) };
}
