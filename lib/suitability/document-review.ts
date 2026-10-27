import { isOfficialUrl } from "@/lib/discovery/model";
import type { RealityCheck, RecordedRequirement } from "./model";

export type DocumentPage = { page: number; text: string };
export type ReviewedDocumentSnapshot = {
  version: 1;
  sourceUrl: string;
  fileName: string;
  sha256: string;
  extractedAt: string;
  reviewedAt?: string;
  pages: DocumentPage[];
};
export type DocumentCandidate = RecordedRequirement & { documentHash: string; pageNumber: number };
export type PageDifference = { page: number; added: string[]; removed: string[] };
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_PAGES = 20;
export const MAX_DOCUMENT_TEXT = 160_000;
const MAX_PAGE_TEXT = 20_000;
const MAX_CANDIDATES = 40;

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const timestamp = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 35 && Number.isFinite(Date.parse(value));

export function isReviewedDocumentSnapshot(value: unknown): value is ReviewedDocumentSnapshot {
  if (
    !object(value) ||
    value.version !== 1 ||
    typeof value.sourceUrl !== "string" ||
    value.sourceUrl.length > 1500 ||
    !isOfficialUrl(value.sourceUrl) ||
    typeof value.fileName !== "string" ||
    !value.fileName ||
    value.fileName.length > 160 ||
    typeof value.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    !timestamp(value.extractedAt) ||
    (value.reviewedAt !== undefined && !timestamp(value.reviewedAt)) ||
    !Array.isArray(value.pages) ||
    value.pages.length < 1 ||
    value.pages.length > MAX_DOCUMENT_PAGES
  )
    return false;
  let characters = 0;
  return value.pages.every((page, index) => {
    if (!object(page) || page.page !== index + 1 || typeof page.text !== "string") return false;
    characters += page.text.length;
    return page.text.length <= MAX_PAGE_TEXT && characters <= MAX_DOCUMENT_TEXT;
  });
}

/** These are verbatim extracted passages, not a complete or verified requirement assessment. */
function excerpts(text: string): string[] {
  return text.split(/\n+/).flatMap((line) => {
    const parts: string[] = [];
    let remaining = line.trim();
    while (remaining.length > 1500) {
      const space = remaining.lastIndexOf(" ", 1500);
      const end = space > 500 ? space : 1500;
      parts.push(remaining.slice(0, end).trim());
      remaining = remaining.slice(end).trim();
    }
    if (remaining) parts.push(remaining);
    return parts;
  });
}

export function documentCandidates(
  snapshot: ReviewedDocumentSnapshot,
  limit = MAX_CANDIDATES,
): { candidates: DocumentCandidate[]; truncated: boolean } {
  if (!isReviewedDocumentSnapshot(snapshot)) throw new Error("Unsupported document snapshot.");
  if (!Number.isInteger(limit) || limit < 0 || limit > MAX_CANDIDATES)
    throw new Error("Review up to 40 requirement candidates at a time.");
  const candidates: DocumentCandidate[] = [];
  let truncated = false;
  for (const page of snapshot.pages) {
    for (const excerpt of excerpts(page.text)) {
      if (
        !/\b(must|shall|required?|requirements?|submit|submission|compulsory|eligib\w*|deadline|closing|evaluation|criteria|documents?|certificat\w*)\b/i.test(
          excerpt,
        )
      )
        continue;
      if (candidates.length >= limit) {
        truncated = true;
        continue;
      }
      candidates.push({
        id: `manual-${crypto.randomUUID()}`,
        label: excerpt.length > 177 ? excerpt.slice(0, 177) + "…" : excerpt,
        kind: "submission",
        excerpt,
        sourceUrl: snapshot.sourceUrl,
        page: String(page.page),
        pageNumber: page.page,
        documentHash: snapshot.sha256,
        createdAt: snapshot.extractedAt,
      });
    }
  }
  return { candidates, truncated };
}

/** Multiset comparison retains duplicate passages; page shifts can appear as remove/add pairs. */
export function compareDocumentPages(
  previous: ReviewedDocumentSnapshot,
  current: ReviewedDocumentSnapshot,
): PageDifference[] {
  if (!isReviewedDocumentSnapshot(previous) || !isReviewedDocumentSnapshot(current))
    throw new Error("Both document snapshots must be valid before comparison.");
  const differences: PageDifference[] = [];
  for (let page = 1; page <= Math.max(previous.pages.length, current.pages.length); page++) {
    const before = excerpts(previous.pages[page - 1]?.text ?? "");
    const after = excerpts(current.pages[page - 1]?.text ?? "");
    const remaining = [...before];
    const added = after.filter((excerpt) => {
      const index = remaining.indexOf(excerpt);
      if (index < 0) return true;
      remaining.splice(index, 1);
      return false;
    });
    if (added.length || remaining.length) differences.push({ page, added, removed: remaining });
  }
  return differences;
}

/** Main assessment integration must call this whenever a document review is approved. */
export function invalidateDocumentAssessment(check: RealityCheck): RealityCheck {
  return {
    ...check,
    packReviewed: false,
    answers: {},
    reviewed: {},
    evaluatedAt: "",
    completedActions: [],
  };
}

export function approveDocumentSnapshot(
  snapshot: ReviewedDocumentSnapshot,
): ReviewedDocumentSnapshot {
  if (!isReviewedDocumentSnapshot(snapshot)) throw new Error("Unsupported document snapshot.");
  return { ...snapshot, reviewedAt: new Date().toISOString() };
}

/** Reads only the selected local file. Neither the file nor source URL is sent to a server. */
export async function extractDocumentPDF(
  file: File,
  sourceUrl: string,
  options: { signal?: AbortSignal; onPage?: (page: number, total: number) => void } = {},
): Promise<ReviewedDocumentSnapshot> {
  if (typeof window === "undefined") throw new Error("Local PDF review requires a browser.");
  if (!isOfficialUrl(sourceUrl) || sourceUrl.length > 1500)
    throw new Error("Choose an official eTender document or listing URL first.");
  if (!file.size || file.size > MAX_DOCUMENT_BYTES)
    throw new Error("Choose a PDF smaller than 10 MB.");
  const cancelled = () => new DOMException("Document reading cancelled.", "AbortError");
  const check = () => {
    if (options.signal?.aborted) throw cancelled();
  };
  check();
  const data = await file.arrayBuffer();
  if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-")
    throw new Error("Choose a valid PDF file.");
  check();
  if (!crypto.subtle) throw new Error("Document hashes require HTTPS or localhost.");
  const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const pdf = await import("pdfjs-dist");
  check();
  pdf.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const task = pdf.getDocument({ data });
  let destroyed: Promise<void> | undefined;
  const destroy = () => (destroyed ??= task.destroy());
  const abort = () => {
    void destroy().catch(() => {});
  };
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    check();
    const document = await task.promise;
    if (document.numPages > MAX_DOCUMENT_PAGES)
      throw new Error("Choose a PDF with no more than 20 pages. Review longer packs manually.");
    const pages: DocumentPage[] = [];
    let characters = 0;
    for (let number = 1; number <= document.numPages; number++) {
      check();
      options.onPage?.(number, document.numPages);
      const page = await document.getPage(number);
      try {
        const content = await page.getTextContent();
        check();
        const text = content.items
          .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
          .join("")
          .trim();
        characters += text.length;
        if (text.length > MAX_PAGE_TEXT || characters > MAX_DOCUMENT_TEXT)
          throw new Error(
            "This document contains too much text for local review. Use the manual excerpt form.",
          );
        pages.push({ page: number, text });
      } finally {
        page.cleanup();
      }
    }
    check();
    if (!pages.some((page) => page.text.trim()))
      throw new Error(
        "This PDF has no readable text. Use manual excerpts; scanned-page OCR is not enabled here.",
      );
    return {
      version: 1,
      sourceUrl,
      fileName: file.name.slice(0, 160) || "Selected PDF",
      sha256,
      extractedAt: new Date().toISOString(),
      pages,
    };
  } catch (error) {
    if (options.signal?.aborted) throw cancelled();
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
    await destroy();
  }
}
