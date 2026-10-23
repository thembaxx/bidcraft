"use client";

import {
  approvalBlocker,
  clauseFlags,
  INSPECTION_LABELS,
  inspectionState,
} from "@/lib/bid-anatomy";
import type { ClauseReview, ComplianceDiscrepancy, TenderClause, VaultDocument } from "@/lib/types";
import { ReviewForm } from "./review-form";

export function ClauseInspector({
  clause,
  vaultDocs,
  flags,
  onReview,
  onEvidenceChange,
  onOpenComparison,
  onOpenVault,
}: {
  clause: TenderClause;
  vaultDocs: VaultDocument[];
  flags: ComplianceDiscrepancy[];
  onReview: (outcome: ClauseReview["outcome"], note: string) => boolean;
  onEvidenceChange: (ids: string[]) => void;
  onOpenComparison: () => void;
  onOpenVault: () => void;
}) {
  const state = inspectionState(clause, vaultDocs, flags);
  const linked = vaultDocs.filter((doc) => clause.matchedVaultDocIds.includes(doc.id));
  const missing = clause.matchedVaultDocIds.filter((id) => !vaultDocs.some((doc) => doc.id === id));
  const openFlags = clauseFlags(clause, flags);
  return (
    <article className="anatomy-inspector" aria-label={`Clause inspector for ${clause.code}`}>
      <header className="anatomy-inspector-head">
        <div>
          <span className="anatomy-eyebrow">
            {clause.code} · {clause.mandatory ? "Mandatory" : "Evaluated criterion"}
          </span>
          <h4>{clause.title}</h4>
        </div>
        <span className="anatomy-status" data-status={state}>
          {INSPECTION_LABELS[state]}
        </span>
      </header>
      <section className="anatomy-copy">
        <h5>Tender requirement</h5>
        <p>{clause.originalText}</p>
      </section>
      <section className="anatomy-copy">
        <div className="anatomy-section-title">
          <h5>Current proposal response</h5>
          <button type="button" onClick={onOpenComparison}>
            Edit in comparison →
          </button>
        </div>
        <p>{clause.proposalResponseText || "No response has been written."}</p>
        <p className="anatomy-muted">
          Recorded alignment: {clause.complianceStatus}. AI confidence: {clause.confidenceScore}%.{" "}
          {clause.aiNote}
        </p>
      </section>
      {openFlags.length > 0 && (
        <section className="anatomy-flags">
          <h5>
            {openFlags.length} unresolved {openFlags.length === 1 ? "flag" : "flags"}
          </h5>
          {openFlags.map((flag) => (
            <p key={flag.id}>
              <strong>{flag.severity === "critical" ? "Critical: " : "Warning: "}</strong>
              {flag.issueTitle}
            </p>
          ))}
          <button type="button" onClick={onOpenVault}>
            Open compliance remediation →
          </button>
        </section>
      )}
      <section className="anatomy-copy">
        <h5>Linked evidence ({linked.length})</h5>
        {linked.length === 0 && (
          <p className="anatomy-muted">
            No source record is linked. Choose evidence below before recording approval.
          </p>
        )}
        {linked.map((doc) => (
          <details key={doc.id} className="anatomy-evidence">
            <summary>
              <span>{doc.referenceCode}</span>
              {doc.title}
            </summary>
            <p>{doc.fullText}</p>
            <p className="anatomy-muted">
              Record updated {doc.dateUpdated}. Check its current validity against the original
              source.
            </p>
          </details>
        ))}
        {missing.length > 0 && (
          <p className="anatomy-blocker">
            Unavailable evidence: {missing.join(", ")}. Remove or replace these links.
          </p>
        )}
        <details className="anatomy-evidence-picker">
          <summary>Manage evidence links</summary>
          <fieldset>
            <legend className="sr-only">Evidence linked to {clause.code}</legend>
            {vaultDocs.map((doc) => (
              <label key={doc.id}>
                <input
                  type="checkbox"
                  checked={clause.matchedVaultDocIds.includes(doc.id)}
                  onChange={(event) =>
                    onEvidenceChange(
                      event.target.checked
                        ? [...clause.matchedVaultDocIds, doc.id]
                        : clause.matchedVaultDocIds.filter((id) => id !== doc.id),
                    )
                  }
                />
                <span>
                  <strong>{doc.referenceCode}</strong>
                  {doc.title}
                </span>
              </label>
            ))}
            {missing.map((id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    onEvidenceChange(clause.matchedVaultDocIds.filter((item) => item !== id))
                  }
                />
                <span>Remove unavailable record: {id}</span>
              </label>
            ))}
          </fieldset>
          <p className="anatomy-muted">
            Changing evidence links clears the previous human review and creates a version snapshot.
          </p>
        </details>
      </section>
      <ReviewForm
        key={`${clause.id}-${clause.proposalResponseText}-${clause.matchedVaultDocIds.join(",")}`}
        clause={clause}
        blocker={approvalBlocker(clause, vaultDocs, flags)}
        onReview={onReview}
      />
    </article>
  );
}
