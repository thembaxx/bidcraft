import type { ProposalVersion, TenderProject } from "./types";

export function commitProposal(
  tender: TenderProject,
  changes: Partial<
    Pick<TenderProject, "clauses" | "executiveSummary" | "discrepancies" | "leadScore" | "grade">
  >,
  triggerType: ProposalVersion["triggerType"],
  summary: string,
): TenderProject {
  const updated = { ...tender, ...changes };
  if (changes.clauses && changes.leadScore === undefined) {
    updated.leadScore = Math.round(
      updated.clauses.reduce((sum, clause) => sum + clause.confidenceScore, 0) /
        Math.max(1, updated.clauses.length),
    );
  }
  if (changes.grade === undefined && updated.leadScore !== tender.leadScore) {
    updated.grade =
      updated.leadScore >= 90
        ? "Grade A+"
        : updated.leadScore >= 80
          ? "Grade A"
          : updated.leadScore >= 70
            ? "Grade B"
            : "Needs Review";
  }
  const revision =
    Math.max(
      0,
      ...tender.versions.map((version) =>
        Number(version.versionNumber.match(/^v1\.(\d+)$/)?.[1] ?? 0),
      ),
    ) + 1;
  const version: ProposalVersion = {
    id: `ver-${crypto.randomUUID()}`,
    versionNumber: `v1.${revision}`,
    timestamp: new Date().toISOString(),
    author:
      triggerType === "Human Review"
        ? "Local reviewer"
        : triggerType === "Manual Edit"
          ? tender.ownerName
          : "Bidcraft AI (Gemini)",
    triggerType,
    summary,
    complianceScoreSnapshot: updated.leadScore,
    clausesSnapshot: structuredClone(updated.clauses),
    executiveSummarySnapshot: updated.executiveSummary,
    discrepanciesSnapshot: structuredClone(updated.discrepancies),
  };
  return { ...updated, versions: [version, ...tender.versions] };
}

export function restoreProposal(tender: TenderProject, version: ProposalVersion): TenderProject {
  // Old snapshots did not capture flags. Reopen known flags according to the restored clauses.
  const discrepancies =
    version.discrepanciesSnapshot ??
    tender.discrepancies
      .filter((flag) => version.clausesSnapshot.some((clause) => clause.code === flag.clauseCode))
      .map((flag) => ({
        ...flag,
        resolved:
          version.clausesSnapshot.find((clause) => clause.code === flag.clauseCode)
            ?.complianceStatus === "compliant",
      }));
  return commitProposal(
    tender,
    {
      clauses: structuredClone(version.clausesSnapshot),
      executiveSummary: version.executiveSummarySnapshot,
      discrepancies: structuredClone(discrepancies),
      leadScore: version.complianceScoreSnapshot,
    },
    "Manual Edit",
    `Restored proposal state from ${version.versionNumber} (${version.timestamp})`,
  );
}
