import "server-only";
import { unstable_cache } from "next/cache";
import { isRecord } from "@/lib/validation";
import { noticeKind, sourceDate } from "./model";
import {
  DISCOVERY_HOME,
  type DiscoveryIndex,
  type TenderDetail,
  type TenderDocument,
  type TenderNotice,
} from "./types";

const PORTAL = "https://www.etenders.gov.za";
const OCDS = "https://ocds-api.etenders.gov.za";
const PAGE_SIZE = 250;
const MAX_NOTICES = 8000;
const text = (value: unknown, max = 300) =>
  typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
const yesNo = (value: unknown) => (typeof value === "boolean" ? value : null);

async function sourceJson(url: URL, attempts = 2, timeoutMs = 18000): Promise<unknown> {
  // URLs are built only from these two fixed government origins, never from a client URL.
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Treasury returned HTTP ${response.status}.`);
      const body = await response.text();
      if (body.length > 8 * 1024 * 1024)
        throw new Error("Treasury response exceeded the supported size.");
      return JSON.parse(body);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function normalizeNotice(raw: unknown): TenderNotice {
  if (
    !isRecord(raw) ||
    !Number.isInteger(raw.id) ||
    Number(raw.id) <= 0 ||
    typeof raw.description !== "string" ||
    !raw.description.trim() ||
    typeof raw.tender_No !== "string"
  )
    throw new Error("Treasury returned an unexpected notice format.");
  const id = String(raw.id);
  const briefing = yesNo(raw.briefingSession);
  const compulsory = yesNo(raw.briefingCompulsory);
  const title = text(raw.description, 4000);
  const type = text(raw.type);
  return {
    id,
    reference: text(raw.tender_No),
    title,
    buyer: text(raw.organ_of_State || raw.department),
    province: text(raw.province),
    category: text(raw.category),
    procurementType: type,
    sourceStatus: text(raw.status),
    publishedAt: sourceDate(raw.date_Published),
    closesAt: sourceDate(raw.closing_Date),
    briefing:
      compulsory === true
        ? "required"
        : briefing === true
          ? "optional"
          : briefing === false
            ? "none"
            : "unknown",
    briefingAt: sourceDate(raw.compulsory_briefing_session),
    documentCount: Array.isArray(raw.supportDocument)
      ? raw.supportDocument.filter((item) => isRecord(item) && item.active !== false).length
      : 0,
    noticeKind: noticeKind(title, type),
    sourceUrl: DISCOVERY_HOME,
  };
}

function listUrl(start: number) {
  const url = new URL("/Home/PaginatedTenderOpportunities", PORTAL);
  const params = url.searchParams;
  for (const [key, value] of Object.entries({
    draw: "1",
    start: String(start),
    length: String(PAGE_SIZE),
    status: "1",
    "search[value]": "",
    "search[regex]": "false",
    "order[0][column]": "4",
    "order[0][dir]": "desc",
  }))
    params.set(key, value);
  [
    "",
    "category",
    "description",
    "eSubmission",
    "date_Published",
    "closing_Date",
    "actions",
  ].forEach((data, index) => {
    params.set(`columns[${index}][data]`, data);
    params.set(`columns[${index}][name]`, "");
    params.set(`columns[${index}][searchable]`, "true");
    params.set(`columns[${index}][orderable]`, "true");
    params.set(`columns[${index}][search][value]`, "");
    params.set(`columns[${index}][search][regex]`, "false");
  });
  return url;
}

const getPage = unstable_cache(
  async (start: number) => {
    const raw = await sourceJson(listUrl(start));
    if (
      !isRecord(raw) ||
      !Array.isArray(raw.data) ||
      !Number.isInteger(raw.recordsTotal) ||
      Number(raw.recordsTotal) < 0
    )
      throw new Error("Treasury returned an unexpected listing format.");
    const notices = raw.data.map(normalizeNotice);
    if (Number(raw.recordsTotal) > 0 && notices.length === 0 && start === 0)
      throw new Error("Treasury returned an incomplete listing.");
    return {
      notices,
      details: raw.data.map(normalizeDetailFields),
      total: Number(raw.recordsTotal),
      checkedAt: new Date().toISOString(),
    };
  },
  ["treasury-advertised-page-v1", String(PAGE_SIZE)],
  { revalidate: 900 },
);

export async function getTreasuryIndex() {
  const first = await getPage(0);
  const pages = [first];
  const total = Math.min(first.total, MAX_NOTICES);
  // Bounded parallelism keeps cold requests quick without flooding the public portal.
  for (let start = PAGE_SIZE; start < total; start += PAGE_SIZE * 3) {
    const starts = [start, start + PAGE_SIZE, start + PAGE_SIZE * 2].filter(
      (offset) => offset < total,
    );
    pages.push(...(await Promise.all(starts.map((offset) => getPage(offset)))));
  }
  const notices = [
    ...new Map(pages.flatMap((page) => page.notices).map((notice) => [notice.id, notice])).values(),
  ];
  const index: DiscoveryIndex = {
    notices,
    sourceTotal: first.total,
    complete:
      first.total <= MAX_NOTICES &&
      notices.length >= first.total &&
      pages.every((page) => page.total === first.total),
    checkedAt: pages.map((page) => page.checkedAt).sort()[0],
  };
  return { ...index, detailFields: pages.flatMap((page) => page.details) };
}

const getOcdsDay = unstable_cache(
  async (publishedDate: string) => {
    const day = new Date(`${publishedDate}T00:00:00Z`);
    const previous = new Date(day.getTime() - 86400000).toISOString().slice(0, 10);
    const url = new URL("/api/OCDSReleases", OCDS);
    url.search = new URLSearchParams({
      PageNumber: "1",
      PageSize: "1000",
      dateFrom: previous,
      dateTo: publishedDate,
    }).toString();
    const raw = await sourceJson(url, 1, 6000);
    if (!isRecord(raw) || !Array.isArray(raw.releases))
      throw new Error("Unexpected OCDS release format.");
    return raw.releases
      .filter(isRecord)
      .filter((release) => isRecord(release.tender))
      .map((release) => {
        const tender = release.tender as Record<string, unknown>;
        const period = isRecord(tender.tenderPeriod) ? tender.tenderPeriod : {};
        return {
          id: text(tender.id),
          ocid: text(release.ocid),
          closesAt: sourceDate(period.endDate),
        };
      });
  },
  ["treasury-ocds-day-v1"],
  { revalidate: 900 },
);

function normalizeDetailFields(raw: unknown) {
  if (!isRecord(raw)) throw new Error("Unexpected Treasury record.");
  const row = raw;
  const documents: TenderDocument[] = (
    Array.isArray(row.supportDocument) ? row.supportDocument : []
  )
    .filter(isRecord)
    .filter((doc) => doc.active !== false)
    .flatMap((doc) => {
      const docId = text(doc.supportDocumentID, 80);
      const title = text(doc.fileName, 400);
      if (
        !/^[a-f\d-]{36}$/i.test(docId) ||
        !title ||
        typeof doc.extension !== "string" ||
        !/^\.[a-z\d]{1,8}$/i.test(doc.extension)
      )
        return [];
      const download = new URL("/home/Download", PORTAL);
      download.search = new URLSearchParams({
        blobName: `${docId}${doc.extension}`,
        downloadedFileName: title,
      }).toString();
      return [{ id: docId, title, url: download.href }];
    });
  return {
    id: String(row.id),
    description: text(row.description, 20000),
    conditions: text(row.conditions, 8000),
    delivery: text(row.delivery, 1000),
    briefingVenue: text(row.briefingVenue, 1500),
    documents,
  };
}

export async function getTreasuryDetail(id: string): Promise<TenderDetail> {
  const index = await getTreasuryIndex();
  const notice = index.notices.find((item) => item.id === id);
  const fields = index.detailFields.find((item) => item.id === id);
  if (!notice || !fields) throw new Error("This notice is no longer in the advertised collection.");
  const detail = { ...notice, ...fields, checkedAt: index.checkedAt };
  let match: { ocid: string; closesAt: string | null } | undefined;
  let ocdsChecked = false;
  if (detail.publishedAt) {
    try {
      const releases = await getOcdsDay(detail.publishedAt.slice(0, 10));
      match = releases.find(
        (release) => release.id === id && /^ocds-[a-z\d-]+$/i.test(release.ocid),
      );
      ocdsChecked = Boolean(match);
    } catch {
      /* The official notice remains usable when the supplementary OCDS feed fails. */
    }
  }
  return {
    ...detail,
    ocid: match?.ocid ?? null,
    ocdsUrl: match ? `${OCDS}/api/OCDSReleases/release/${encodeURIComponent(match.ocid)}` : null,
    ocdsChecked,
    deadlineConflict: Boolean(
      match?.closesAt &&
      detail.closesAt &&
      Date.parse(match.closesAt) !== Date.parse(detail.closesAt),
    ),
  };
}
