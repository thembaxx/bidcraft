"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  CalendarBlank,
  CheckCircle,
  FileText,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { rememberRealityEntry } from "@/lib/suitability/storage";
import Link from "next/link";
import { downloadTenderReminder } from "@/lib/discovery/calendar";
import { formatTenderDate } from "@/lib/discovery/model";
import { isTenderDetail } from "@/lib/discovery/storage";
import type { SavedTender, TenderDetail, TenderNotice } from "@/lib/discovery/types";

export function NoticeDetail({
  notice,
  saved,
  feedback,
  onSave,
  onImport,
  onClose,
}: {
  notice: TenderNotice;
  saved?: SavedTender;
  onSave: (notice: TenderNotice, detail?: TenderDetail) => void;
  onImport: (notice: TenderNotice) => void;
  onClose: () => void;
  feedback?: string;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<TenderDetail | undefined>(saved?.detail);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [openedAt] = useState(Date.now);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/tenders/${notice.id}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]),
        });
        const data: unknown = await response.json();
        if (!response.ok || !isTenderDetail(data)) throw new Error("Source unavailable");
        if (!controller.signal.aborted) {
          setDetail(data);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    })();
    return () => controller.abort();
  }, [notice.id, retry]);
  const current = detail ?? notice;
  const missedBriefing =
    current.briefing === "required" &&
    Boolean(current.briefingAt && Date.parse(current.briefingAt) < openedAt);
  const briefing = {
    required: "Compulsory briefing",
    optional: "Optional briefing",
    none: "No briefing listed",
    unknown: "Not published",
  }[current.briefing];
  return (
    <Dialog
      labelledBy="discovery-detail-title"
      onClose={onClose}
      className="discovery-detail-dialog"
    >
      <div className="discovery-detail-top">
        <span className="discovery-source">
          <span aria-hidden="true" /> National Treasury eTender
        </span>
        <button
          type="button"
          className="discovery-icon-button"
          aria-label="Close tender details"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p className="discovery-reference">{current.reference}</p>
      <h2 id="discovery-detail-title">{current.title}</h2>
      <p className="discovery-detail-buyer">{current.buyer || "Buyer not published"}</p>
      <div className="discovery-detail-actions">
        <button
          type="button"
          className="discovery-primary"
          onClick={() => {
            rememberRealityEntry(current, detail);
            router.push("/tenders/check/" + current.id);
          }}
        >
          Check suitability <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button type="button" className="discovery-secondary" onClick={() => onImport(current)}>
          Create bid workspace
        </button>
        <button
          type="button"
          className="discovery-secondary"
          aria-pressed={Boolean(saved)}
          onClick={() => onSave(current, detail)}
        >
          <BookmarkSimple size={17} weight={saved ? "fill" : "regular"} aria-hidden="true" />
          {saved ? "Saved tender" : "Save tender"}
        </button>
      </div>
      <p className="discovery-small">
        Check requirements before pursuing this opportunity. Assessments remain browser-local and do
        not certify eligibility.
      </p>
      <div className="discovery-eligibility-note" role="note">
        <WarningCircle size={18} aria-hidden="true" />
        <p>
          <strong>Check before you bid.</strong> A matching tender is not proof of eligibility.
          Review every mandatory condition and supporting document
          {missedBriefing ? " — the listed compulsory briefing date has passed." : "."}
        </p>
      </div>
      {current.closesAt && Date.parse(current.closesAt) > openedAt && (
        <button
          type="button"
          className="discovery-calendar-action"
          onClick={() => downloadTenderReminder(current)}
        >
          <CalendarBlank size={17} aria-hidden="true" /> Download a calendar reminder{" "}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      )}
      {feedback && (
        <p role="status" className="discovery-alert">
          {feedback}
        </p>
      )}
      {status === "loading" && (
        <p role="status" className="discovery-inline-status">
          Checking the official notice and documents…
        </p>
      )}
      {status === "error" && (
        <div className="discovery-alert" role="status">
          <p>
            {detail
              ? "Showing your saved source details. The latest notice could not be checked."
              : "The latest source details could not be loaded. Your saved notice is still available."}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setRetry(retry + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {detail?.deadlineConflict && (
        <p className="discovery-alert" role="status">
          The official feeds show different closing times. The time below follows the eTender
          portal; confirm it in the original tender documents.
        </p>
      )}
      <dl className="discovery-detail-facts discovery-key-facts">
        <div>
          <dt>Closes · SAST</dt>
          <dd>{formatTenderDate(current.closesAt, true)}</dd>
        </div>
        <div>
          <dt>Province</dt>
          <dd>{current.province || "Not published"}</dd>
        </div>
        <div>
          <dt>Briefing</dt>
          <dd>
            {briefing}
            {current.briefingAt ? " · " + formatTenderDate(current.briefingAt, true) : ""}
          </dd>
        </div>
      </dl>
      <details className="discovery-secondary-details">
        <summary>
          More tender information <span aria-hidden="true">+</span>
        </summary>
        <dl className="discovery-detail-facts">
          <div>
            <dt>Buyer / department</dt>
            <dd>{current.buyer || "Not published"}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{current.category || "Not published"}</dd>
          </div>
          <div>
            <dt>Procurement type</dt>
            <dd>{current.procurementType || "Not published"}</dd>
          </div>
          <div>
            <dt>Source status</dt>
            <dd>{current.sourceStatus || "Not published"}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{formatTenderDate(current.publishedAt)}</dd>
          </div>
          <div>
            <dt>Estimated value · ZAR</dt>
            <dd>Not published</dd>
          </div>
        </dl>
      </details>
      {detail && detail.description !== current.title && (
        <section className="discovery-detail-section">
          <h3>Notice description</h3>
          <p>{detail.description}</p>
        </section>
      )}
      <section className="discovery-detail-section">
        <h3>Briefing & delivery</h3>
        <p>
          {briefing}
          {current.briefingAt ? ` · ${formatTenderDate(current.briefingAt, true)} SAST` : ""}
        </p>
        {detail?.briefingVenue && <p>{detail.briefingVenue}</p>}
        {detail?.delivery && <p>{detail.delivery}</p>}
      </section>
      {detail?.conditions && (
        <section className="discovery-detail-section">
          <h3>Conditions from the source</h3>
          <p className="discovery-preserve-copy">{detail.conditions}</p>
        </section>
      )}
      <section className="discovery-detail-section">
        <h3>Official documents {detail && <span>({detail.documents.length})</span>}</h3>
        {detail?.documents.map((doc) => (
          <a
            className="discovery-document"
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText size={20} aria-hidden="true" />
            <span>{doc.title}</span>
            <ArrowUpRight size={18} aria-hidden="true" />
            <span className="sr-only">Opens official document in a new tab</span>
          </a>
        ))}
        {detail && detail.documents.length === 0 && (
          <p>
            No document links are available in this source record. Check the official listing using
            reference {current.reference}.
          </p>
        )}
        {!detail && (
          <p className="discovery-small">
            Document links will appear when the official notice is available.
          </p>
        )}
      </section>
      <details className="discovery-source-details">
        <summary>
          <CheckCircle size={17} aria-hidden="true" /> Source & freshness
        </summary>
        <p>
          Published by the buyer on National Treasury’s eTender portal. Source status and briefing
          information do not establish your business’s eligibility.
        </p>
        {detail && (
          <p>
            Last checked {formatTenderDate(detail.checkedAt, true)} SAST.
            {status === "error" ? " Saved copy; current availability is unconfirmed." : ""}
          </p>
        )}
        <p>
          <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
            Open official listing <ArrowUpRight size={13} aria-hidden="true" />
          </a>{" "}
          and search reference <strong>{current.reference}</strong>.
        </p>
        {detail?.ocdsUrl && (
          <p>
            <a href={detail.ocdsUrl} target="_blank" rel="noopener noreferrer">
              View matching open-data record ↗
            </a>
          </p>
        )}
        <p>
          <a
            href="https://data.etenders.gov.za/Home/LearnMore"
            target="_blank"
            rel="noopener noreferrer"
          >
            Treasury’s publication policy ↗
          </a>{" "}
          permits reuse with source attribution. Coverage is incomplete; confirm deadlines and
          amendments before submitting.{" "}
          <Link href="/data-sources">How Bidcraft uses tender data</Link>.
        </p>
      </details>
    </Dialog>
  );
}
