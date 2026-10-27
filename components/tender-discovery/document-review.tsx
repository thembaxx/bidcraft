"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  compareDocumentPages,
  approveDocumentSnapshot,
  documentCandidates,
  extractDocumentPDF,
  type DocumentCandidate,
  type ReviewedDocumentSnapshot,
} from "@/lib/suitability/document-review";
import { isOfficialUrl } from "@/lib/discovery/model";
import type { RequirementKind } from "@/lib/suitability/model";

const input =
  "w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-[#101714] dark:text-neutral-100";
const action =
  "min-h-11 rounded-xl bg-[#12695C] px-4 py-3 text-sm font-bold text-white disabled:opacity-50";
type Selection = DocumentCandidate & { approved: boolean };

export function DocumentReview({
  sourceUrl,
  existing,
  onApprove,
  remainingSlots = 40,
}: {
  sourceUrl: string;
  existing?: ReviewedDocumentSnapshot;
  remainingSlots?: number;
  onApprove: (
    candidates: DocumentCandidate[],
    snapshot: ReviewedDocumentSnapshot,
  ) => void | Promise<void>;
}) {
  const id = useId();
  const controller = useRef<AbortController | null>(null);
  const [snapshot, setSnapshot] = useState<ReviewedDocumentSnapshot | null>(null);
  const [candidates, setCandidates] = useState<Selection[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [changesConfirmed, setChangesConfirmed] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const validSource = isOfficialUrl(sourceUrl);
  const current = snapshot?.sourceUrl === sourceUrl ? snapshot : null;
  const changed = !!(
    existing &&
    current &&
    (existing.sha256 !== current.sha256 || existing.sourceUrl !== current.sourceUrl)
  );
  const differences = existing && current ? compareDocumentPages(existing, current) : [];
  const approved = candidates.filter((candidate) => candidate.approved);
  useEffect(() => () => controller.current?.abort(), []);
  async function read(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setMessage("Reading your selected PDF on this device…");
    setSnapshot(null);
    setCandidates([]);
    setConfirmed(false);
    setChangesConfirmed(false);
    setTruncated(false);
    try {
      const result = await extractDocumentPDF(file, sourceUrl, {
        signal: request.signal,
        onPage: (page, total) => {
          if (!request.signal.aborted) setMessage(`Reading page ${page} of ${total} locally…`);
        },
      });
      if (request.signal.aborted || controller.current !== request) return;
      const extracted = documentCandidates(result);
      setSnapshot(result);
      setCandidates(extracted.candidates.map((candidate) => ({ ...candidate, approved: false })));
      setTruncated(extracted.truncated);
      setMessage(
        "Review the source association and every passage before saving. No assessment was changed.",
      );
    } catch (error) {
      if (controller.current === request)
        setMessage(
          error instanceof Error && error.name !== "AbortError"
            ? error.message
            : "Document reading cancelled. Your saved review is unchanged.",
        );
    } finally {
      if (controller.current === request) setBusy(false);
    }
  }
  async function approve() {
    if (!current || !confirmed || (changed && !changesConfirmed)) return;
    if (approved.length > Math.max(0, Math.min(40, remainingSlots))) {
      setMessage(
        "There is not enough space for these requirements. Remove older records or select fewer passages.",
      );
      return;
    }
    setSaving(true);
    try {
      await onApprove(
        approved.map(({ approved: _approved, ...candidate }) => candidate),
        approveDocumentSnapshot(current),
      );
      setSnapshot(null);
      setCandidates([]);
      setMessage(
        "Document review saved. Recheck the assessment and each requirement against your evidence.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save this review. Your selection is still available.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#17201C]"
    >
      <h2 id={`${id}-title`} className="text-lg font-bold">
        Review an original tender PDF
      </h2>
      <p className="text-xs leading-6 text-neutral-600 dark:text-neutral-300">
        Download an official public attachment yourself, then choose it here. The file is read on
        this device. Review candidates and page differences; these are not verified eligibility
        checks or drafted commitments. Private bid documents should stay outside this workflow.
      </p>
      <p className="break-words text-xs">
        Source association: {sourceUrl || "Select an official source first."}
      </p>
      {validSource && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-bold text-[#12695C] dark:text-[#9BDBBE]"
        >
          Open official source
        </a>
      )}
      <label className="block space-y-2 text-sm font-semibold">
        Choose a PDF to review locally · up to 10 MB / 20 pages
        <input
          className={input}
          type="file"
          accept=".pdf,application/pdf"
          disabled={!validSource || busy || saving}
          onChange={(event) => void read(event)}
        />
      </label>
      {busy && (
        <button type="button" className={action} onClick={() => controller.current?.abort()}>
          Cancel document reading
        </button>
      )}
      {current && (
        <>
          <div className="space-y-2 rounded-xl bg-[#F8F6EF] p-3 text-xs dark:bg-[#101714]">
            <p>
              {current.fileName} · {current.pages.length} pages
            </p>
            <p className="break-all">Local file SHA-256: {current.sha256}</p>
            <p>
              The hash identifies these local bytes. It does not authenticate the file or its
              official origin.
            </p>
          </div>
          {existing && (
            <section className="space-y-2" aria-label="Document changes">
              <h3 className="text-sm font-bold">Compared with your previous reviewed document</h3>
              <p className="text-xs leading-6">
                {changed
                  ? "File bytes or source association changed. Approval will require a fresh assessment review."
                  : "The selected file has the same hash and source association."}
              </p>
              {changed && !differences.length && (
                <p className="text-xs">
                  No extracted page-text differences were found. PDF metadata, images or layout may
                  still differ.
                </p>
              )}
              {differences.map((difference) => (
                <details
                  key={difference.page}
                  className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
                >
                  <summary className="min-h-11 cursor-pointer text-sm font-bold">
                    Page {difference.page}: {difference.added.length} added /{" "}
                    {difference.removed.length} removed passages
                  </summary>
                  <p className="text-xs leading-6">
                    Page shifts and line wrapping can appear as removed and added text.
                  </p>
                  {difference.removed.map((text, index) => (
                    <p
                      className="my-2 whitespace-pre-wrap border-l-2 border-rose-500 pl-3 text-xs leading-6"
                      key={`removed-${index}`}
                    >
                      <strong>Removed:</strong> {text}
                    </p>
                  ))}
                  {difference.added.map((text, index) => (
                    <p
                      className="my-2 whitespace-pre-wrap border-l-2 border-emerald-600 pl-3 text-xs leading-6"
                      key={`added-${index}`}
                    >
                      <strong>Added:</strong> {text}
                    </p>
                  ))}
                </details>
              ))}
            </section>
          )}
          <h3 className="text-sm font-bold">Passages to consider for your checklist</h3>
          <p className="text-xs leading-6 text-neutral-600 dark:text-neutral-300">
            Nothing is selected automatically. Select passages to keep and choose their
            classification from the buyer’s wording. Unchecked passages are excluded. Keyword
            detection can miss requirements; read the complete pack and continue to use manual
            excerpts.
          </p>
          {truncated && (
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Candidate review is limited to 40 passages. The full page text remains available
              below.
            </p>
          )}
          {!candidates.length && (
            <p className="text-sm">
              No candidate passages found. Review the page text and record requirements manually.
            </p>
          )}
          {candidates.map((candidate) => (
            <article
              key={candidate.id}
              className="space-y-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <label className="flex min-h-11 items-start gap-3 text-sm font-bold">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[#168B7A]"
                  checked={candidate.approved}
                  onChange={(event) =>
                    setCandidates((items) =>
                      items.map((item) =>
                        item.id === candidate.id
                          ? { ...item, approved: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Keep passage from page {candidate.page}
              </label>
              <p className="whitespace-pre-wrap text-xs leading-6">{candidate.excerpt}</p>
              <label className="block space-y-1 text-xs font-bold">
                Checklist title
                <input
                  className={input}
                  value={candidate.label}
                  maxLength={180}
                  onChange={(event) =>
                    setCandidates((items) =>
                      items.map((item) =>
                        item.id === candidate.id ? { ...item, label: event.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <label className="block space-y-1 text-xs font-bold">
                Classification for page {candidate.page}
                <select
                  className={input}
                  value={candidate.kind}
                  onChange={(event) =>
                    setCandidates((items) =>
                      items.map((item) =>
                        item.id === candidate.id
                          ? { ...item, kind: event.target.value as RequirementKind }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="submission">Document or information to submit</option>
                  <option value="mandatory">
                    Mandatory condition explicitly stated by the buyer
                  </option>
                  <option value="evaluation">Evaluation or preference criterion</option>
                </select>
              </label>
            </article>
          ))}
          <details className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
            <summary className="min-h-11 cursor-pointer text-sm font-bold">
              Read all extracted page text
            </summary>
            {current.pages.map((page) => (
              <section key={page.page} className="my-4">
                <h4 className="text-sm font-bold">Page {page.page}</h4>
                <p className="whitespace-pre-wrap text-xs leading-6">
                  {page.text ||
                    "No text extracted from this page. Check images in the original PDF."}
                </p>
              </section>
            ))}
          </details>
          <label className="flex min-h-11 items-start gap-3 text-xs leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-[#168B7A]"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I checked this local file against the official source and reviewed the passages I
            selected. This is my confirmation, not government verification.
          </label>
          {changed && (
            <label className="flex min-h-11 items-start gap-3 text-xs leading-6">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-[#168B7A]"
                checked={changesConfirmed}
                onChange={(event) => setChangesConfirmed(event.target.checked)}
              />
              I reviewed the document changes. Clear the previous assessment answers and pack-review
              confirmation so I can assess the current pack again.
            </label>
          )}
          <button
            type="button"
            className={action}
            disabled={
              saving ||
              !confirmed ||
              (changed && !changesConfirmed) ||
              approved.some((candidate) => !candidate.label.trim())
            }
            onClick={() => void approve()}
          >
            {saving
              ? "Saving review…"
              : `Approve document review · keep ${approved.length} passages`}
          </button>
        </>
      )}
      <p role="status" className="text-xs leading-6">
        {message}
      </p>
    </section>
  );
}
