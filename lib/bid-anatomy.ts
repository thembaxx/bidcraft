import type {
  ClauseReview,
  ComplianceDiscrepancy,
  TenderClause,
  TenderProject,
  VaultDocument,
} from "./types";
import { commitProposal } from "./proposals";

export type InspectionState =
  | "approved"
  | "blocked"
  | "needs-review"
  | "awaiting-review"
  | "missing-response"
  | "missing-evidence";
export const INSPECTION_LABELS: Record<InspectionState, string> = {
  approved: "Human reviewed",
  blocked: "Blocked",
  "needs-review": "Needs changes or review",
  "awaiting-review": "Awaiting human review",
  "missing-response": "Response missing",
  "missing-evidence": "Evidence missing",
};

export function clauseFlags(clause: TenderClause, flags: ComplianceDiscrepancy[]) {
  return flags.filter(
    (flag) => flag.clauseCode === clause.code && !flag.resolved && flag.severity !== "verified",
  );
}

export function approvalBlocker(
  clause: TenderClause,
  docs: VaultDocument[],
  flags: ComplianceDiscrepancy[],
): string | null {
  if (!clause.proposalResponseText.trim())
    return "Write a proposal response before recording approval.";
  if (
    !clause.matchedVaultDocIds.length ||
    clause.matchedVaultDocIds.some((id) => !docs.some((doc) => doc.id === id))
  )
    return "Link available evidence before recording approval.";
  if (clauseFlags(clause, flags).length)
    return "Resolve the recorded flags in Compliance & vault before approving this response.";
  if (clause.complianceStatus === "non-compliant")
    return "Address the non-compliant response before recording approval.";
  return null;
}

export function inspectionState(
  clause: TenderClause,
  docs: VaultDocument[],
  flags: ComplianceDiscrepancy[],
): InspectionState {
  if (!clause.proposalResponseText.trim()) return "missing-response";
  if (
    !clause.matchedVaultDocIds.length ||
    clause.matchedVaultDocIds.some((id) => !docs.some((doc) => doc.id === id))
  )
    return "missing-evidence";
  const openFlags = clauseFlags(clause, flags);
  if (
    clause.complianceStatus === "non-compliant" ||
    openFlags.some((flag) => flag.severity === "critical")
  )
    return "blocked";
  if (openFlags.length || clause.review?.outcome === "changes-requested") return "needs-review";
  if (clause.review?.outcome === "approved") return "approved";
  return clause.complianceStatus === "partial" ? "needs-review" : "awaiting-review";
}

export function inspectionSummary(tender: TenderProject, docs: VaultDocument[]) {
  const states = tender.clauses.map((clause) => ({
    clause,
    state: inspectionState(clause, docs, tender.discrepancies),
  }));
  const mandatory = states.filter(({ clause }) => clause.mandatory);
  const reviewedMandatory = mandatory.filter(({ state }) => state === "approved").length;
  return {
    states,
    total: states.length,
    mandatory: mandatory.length,
    reviewed: states.filter(({ state }) => state === "approved").length,
    reviewedMandatory,
    awaitingReview: states.filter(({ state }) => state !== "approved").length,
    openFlags: tender.discrepancies.filter((flag) => !flag.resolved && flag.severity !== "verified")
      .length,
    mandatoryProgress: mandatory.length ? reviewedMandatory / mandatory.length : 0,
  };
}

export function recordClauseReview(
  tender: TenderProject,
  clauseId: string,
  docs: VaultDocument[],
  outcome: ClauseReview["outcome"],
  note: string,
): TenderProject {
  const clause = tender.clauses.find((item) => item.id === clauseId);
  if (!clause) throw new Error("This clause is no longer available.");
  if (outcome === "approved") {
    const blocker = approvalBlocker(clause, docs, tender.discrepancies);
    if (blocker) throw new Error(blocker);
  } else if (!note.trim())
    throw new Error("Describe the changes needed before recording the review.");
  return commitProposal(
    tender,
    {
      clauses: tender.clauses.map((item) =>
        item.id === clauseId
          ? {
              ...item,
              review: {
                outcome,
                reviewedAt: new Date().toISOString(),
                reviewer: "Local reviewer",
                note: note.trim() || "Requirement, response and linked evidence reviewed.",
              },
            }
          : item,
      ),
      // A human review does not manufacture a new AI confidence score.
      leadScore: tender.leadScore,
      grade: tender.grade,
    },
    "Human Review",
    `${outcome === "approved" ? "Approved reviewed response for" : "Requested changes to"} ${clause.code}`,
  );
}
