import { isTenderDetail, readSavedOpportunities } from "@/lib/discovery/storage";
import { isTenderNotice } from "@/lib/discovery/model";
import type { TenderDetail, TenderNotice } from "@/lib/discovery/types";
import {
  EMPTY_PROFILE,
  emptyCheck,
  type Answer,
  type RealityCheck,
  type RecordedRequirement,
  type SupplierProfile,
} from "./model";

const PROFILE_KEY = "bidcraft_supplier_profile_v1";
const CHECK_KEY = "bidcraft_reality_checks_v1";
const ENTRY_KEY = "bidcraft_reality_entry_v1";
const isObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
const answer = (v: unknown): v is Answer => v === "yes" || v === "no" || v === "unknown";
const safeRead = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

export function readSupplierProfile(): SupplierProfile {
  const v = safeRead(PROFILE_KEY);
  if (
    !isObject(v) ||
    typeof v.services !== "string" ||
    v.services.length > 1500 ||
    !Array.isArray(v.provinces) ||
    v.provinces.length > 15 ||
    !v.provinces.every((x) => typeof x === "string" && x.length < 50) ||
    !answer(v.travel) ||
    !["registered", "in_progress", "not_registered", "unknown"].includes(String(v.csd)) ||
    !answer(v.taxGoodStanding) ||
    !["experience", "cidbClass", "cidbGrade", "updatedAt"].every(
      (k) => typeof v[k] === "string" && (v[k] as string).length <= 500,
    )
  )
    return { ...EMPTY_PROFILE };
  return v as unknown as SupplierProfile;
}
export function writeSupplierProfile(value: SupplierProfile) {
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ ...value, updatedAt: new Date().toISOString() }),
  );
}
function validRequirement(r: unknown): r is RecordedRequirement {
  return (
    isObject(r) &&
    typeof r.id === "string" &&
    /^manual-[a-f0-9-]{12,}$/.test(r.id) &&
    typeof r.label === "string" &&
    r.label.length <= 180 &&
    typeof r.excerpt === "string" &&
    r.excerpt.length <= 1500 &&
    typeof r.sourceUrl === "string" &&
    r.sourceUrl.length <= 1500 &&
    typeof r.page === "string" &&
    r.page.length <= 50 &&
    ["mandatory", "submission", "evaluation"].includes(String(r.kind)) &&
    typeof r.createdAt === "string" &&
    Number.isFinite(Date.parse(r.createdAt))
  );
}
function validCheck(v: unknown, id: string): v is RealityCheck {
  return (
    isObject(v) &&
    v.tenderId === id &&
    typeof v.sourceFingerprint === "string" &&
    typeof v.evaluatedAt === "string" &&
    typeof v.packReviewed === "boolean" &&
    isObject(v.answers) &&
    Object.keys(v.answers).length <= 100 &&
    Object.values(v.answers).every(answer) &&
    isObject(v.reviewed) &&
    Object.keys(v.reviewed).length <= 100 &&
    Object.values(v.reviewed).every((x) => typeof x === "boolean") &&
    Array.isArray(v.manualRequirements) &&
    v.manualRequirements.length <= 40 &&
    v.manualRequirements.every(validRequirement) &&
    Array.isArray(v.completedActions) &&
    v.completedActions.length <= 100 &&
    v.completedActions.every((x) => typeof x === "string" && x.length <= 100) &&
    (v.sourceSnapshot === undefined || isTenderDetail(v.sourceSnapshot))
  );
}
export function readRealityCheck(id: string): RealityCheck {
  const raw = safeRead(CHECK_KEY);
  if (!isObject(raw) || !validCheck(raw[id], id)) return emptyCheck(id);
  return raw[id];
}
export function writeRealityCheck(check: RealityCheck) {
  if (!/^[1-9]\d{0,9}$/.test(check.tenderId) || !validCheck(check, check.tenderId))
    throw new Error("Invalid assessment. Nothing was saved.");
  const raw = safeRead(CHECK_KEY);
  const records = isObject(raw)
    ? Object.fromEntries(
        Object.entries(raw)
          .filter(([k, v]) => /^[1-9]\d{0,9}$/.test(k) && validCheck(v, k))
          .slice(-49),
      )
    : {};
  localStorage.setItem(CHECK_KEY, JSON.stringify({ ...records, [check.tenderId]: check }));
}
export function rememberRealityEntry(notice: TenderNotice, detail?: TenderDetail) {
  try {
    sessionStorage.setItem(ENTRY_KEY, JSON.stringify({ notice, detail }));
  } catch {
    /* Direct source fetch still works. */
  }
}
export function readRealityEntry(id: string): {
  notice: TenderNotice | null;
  detail: TenderDetail | null;
} {
  try {
    const entry = JSON.parse(sessionStorage.getItem(ENTRY_KEY) || "null");
    if (isObject(entry) && isTenderNotice(entry.notice) && entry.notice.id === id)
      return { notice: entry.notice, detail: isTenderDetail(entry.detail) ? entry.detail : null };
  } catch {
    /* No usable selection */
  }
  const saved = readSavedOpportunities().find((s) => s.notice.id === id);
  return { notice: saved?.notice || null, detail: saved?.detail || null };
}
