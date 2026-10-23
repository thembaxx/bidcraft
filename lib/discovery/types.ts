export const DISCOVERY_SOURCE = "National Treasury eTender" as const;
export const DISCOVERY_HOME = "https://www.etenders.gov.za/Home/opportunities?id=1";
export const SAVED_TENDERS_KEY = "bidcraft_saved_opportunities_v1";
export const TENDER_STORAGE_KEY = "quora_bid_architect_tenders_v1";
export const SELECTION_STORAGE_KEY = "quora_bid_architect_selection_v1";

export interface TenderNotice {
  id: string;
  reference: string;
  title: string;
  buyer: string;
  province: string;
  category: string;
  procurementType: string;
  sourceStatus: string;
  publishedAt: string | null;
  closesAt: string | null;
  briefing: "required" | "optional" | "none" | "unknown";
  briefingAt: string | null;
  documentCount: number;
  noticeKind: "opportunity" | "information" | "results";
  sourceUrl: string;
}

export interface TenderDocument {
  id: string;
  title: string;
  url: string;
}
export interface TenderDetail extends TenderNotice {
  description: string;
  conditions: string;
  delivery: string;
  briefingVenue: string;
  documents: TenderDocument[];
  checkedAt: string;
  ocid: string | null;
  ocdsUrl: string | null;
  ocdsChecked: boolean;
  deadlineConflict: boolean;
}

export interface DiscoveryFilters {
  q: string;
  province: string;
  category: string;
  buyer: string;
  type: string;
  closing: "any" | "7" | "14" | "30";
  published: "any" | "7" | "30";
  briefing: "any" | TenderNotice["briefing"];
  notices: "opportunities" | "all";
  sort: "newest" | "closing";
  page: number;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  q: "",
  province: "",
  category: "",
  buyer: "",
  type: "",
  closing: "any",
  published: "any",
  briefing: "any",
  notices: "opportunities",
  sort: "newest",
  page: 1,
};

export interface DiscoveryFacets {
  provinces: string[];
  categories: string[];
  buyers: string[];
  types: string[];
}
export interface DiscoveryIndex {
  notices: TenderNotice[];
  sourceTotal: number;
  complete: boolean;
  checkedAt: string;
}
export interface DiscoveryResponse {
  items: TenderNotice[];
  total: number;
  page: number;
  pageSize: number;
  sourceTotal: number;
  indexed: number;
  complete: boolean;
  checkedAt: string;
  stale: boolean;
  facets: DiscoveryFacets;
}

export interface SavedTender {
  notice: TenderNotice;
  detail?: TenderDetail;
  savedAt: string;
}
