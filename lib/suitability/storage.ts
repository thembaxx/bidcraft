import { validDocumentSnapshots } from "./model";
import { invalidateDocumentAssessment } from "./document-review";
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
const RECOVERY_KEY = CHECK_KEY + "_recovery_";
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
function validBaseCheck(
  v: unknown,
  id: string,
): v is Omit<RealityCheck, "documentSnapshots"> & { documentSnapshots?: unknown } {
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
function validCheck(v: unknown, id: string): v is RealityCheck {
  return validBaseCheck(v, id) && validDocumentSnapshots(v.documentSnapshots);
}

export type RealityCheckRestore = {
  check: RealityCheck;
  warning: string;
  originalRaw: string | null;
};

export function readRealityCheckState(id: string): RealityCheckRestore {
  let text: string | null = null;
  try {
    text = localStorage.getItem(CHECK_KEY);
    const recoverySlot = localStorage.getItem(RECOVERY_KEY + id);
    const originalRaw = recoverySlot ? localStorage.getItem(recoverySlot) : null;
    if (text === null) return { check: emptyCheck(id), warning: "", originalRaw };
    const raw: unknown = JSON.parse(text);
    if (!isObject(raw)) throw new Error("Unsupported assessment storage.");
    if (!Object.hasOwn(raw, id)) return { check: emptyCheck(id), warning: "", originalRaw };
    const record = raw[id];
    if (!validBaseCheck(record, id)) throw new Error("Unsupported assessment record.");
    if (!validDocumentSnapshots(record.documentSnapshots)) {
      const { documentSnapshots: _invalid, ...base } = record;
      return {
        check: { ...invalidateDocumentAssessment(base), documentSnapshots: [] },
        warning:
          "Saved PDF review data could not be restored. Your recorded requirements remain available; assessment answers were cleared for a fresh review. The original saved data is preserved before any change is saved.",
        originalRaw: text,
      };
    }
    return { check: record as RealityCheck, warning: "", originalRaw };
  } catch {
    return {
      check: emptyCheck(id),
      warning:
        "Saved assessment data could not be read safely. Changes are blocked so the original remains available for recovery. Download it before repairing the saved data.",
      originalRaw: text,
    };
  }
}

export function readRealityCheck(id: string): RealityCheck {
  return readRealityCheckState(id).check;
}

export function writeRealityCheck(check: RealityCheck) {
  if (!/^[1-9]\d{0,9}$/.test(check.tenderId) || !validCheck(check, check.tenderId))
    throw new Error("Invalid assessment. Nothing was saved.");
  const text = localStorage.getItem(CHECK_KEY);
  let raw: unknown = null;
  try {
    raw = text === null ? {} : JSON.parse(text);
  } catch {
    throw new Error("Saved assessment data is unreadable. The original has not been replaced.");
  }
  if (!isObject(raw))
    throw new Error("Saved assessment data is unsupported. The original has not been replaced.");
  const previous = raw[check.tenderId];
  if (Object.hasOwn(raw, check.tenderId) && !validBaseCheck(previous, check.tenderId))
    throw new Error("This saved assessment needs recovery. The original has not been replaced.");
  if (
    validBaseCheck(previous, check.tenderId) &&
    !validDocumentSnapshots(previous.documentSnapshots)
  ) {
    // Preserve the exact original before replacing only its recoverable assessment.
    // Both writes must succeed; quota/permission failures leave the main data untouched.
    const slot = RECOVERY_KEY + check.tenderId + "_" + crypto.randomUUID();
    localStorage.setItem(slot, text!);
    localStorage.setItem(RECOVERY_KEY + check.tenderId, slot);
  }
  // Keep unsupported records belonging to other tenders byte-for-byte as JSON values.
  // They must not disappear merely because a different assessment is saved.
  const otherEntries = Object.entries(raw).filter(([id]) => id !== check.tenderId);
  const validEntries = otherEntries.filter(([id, value]) => validCheck(value, id)).slice(-49);
  const recoverableEntries = otherEntries.filter(([id, value]) => !validCheck(value, id));
  const records = Object.fromEntries([...validEntries, ...recoverableEntries]);
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
