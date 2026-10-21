import type { ComplianceDiscrepancy, ProposalVersion, TenderClause, TenderProject, VaultDocument } from './types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => typeof value[key] === 'string');
export const isScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
export const isComplianceStatus = (value: unknown): value is TenderClause['complianceStatus'] =>
  ['compliant', 'partial', 'non-compliant'].includes(value as string);

export function isClause(value: unknown): value is TenderClause {
  return isRecord(value) && strings(value, ['id', 'code', 'title', 'originalText', 'proposalSectionTitle', 'proposalResponseText', 'aiNote']) &&
    typeof value.mandatory === 'boolean' &&
    ['Legal & Statutory', 'Technical Architecture', 'Financial & SLA', 'Security & ISO'].includes(value.category as string) &&
    isComplianceStatus(value.complianceStatus) && isScore(value.confidenceScore) && stringArray(value.matchedVaultDocIds) &&
    (value.review === undefined || (isRecord(value.review) && strings(value.review, ['reviewedAt', 'reviewer', 'note']) &&
      Number.isFinite(Date.parse(value.review.reviewedAt as string)) && ['approved', 'changes-requested'].includes(value.review.outcome as string)));
}

export function isDiscrepancy(value: unknown): value is ComplianceDiscrepancy {
  return isRecord(value) && strings(value, ['id', 'clauseCode', 'issueTitle', 'tenderRequirement', 'currentProposalText', 'vaultEvidenceCited', 'recommendedFix']) &&
    ['critical', 'warning', 'verified'].includes(value.severity as string) && typeof value.resolved === 'boolean';
}

function isVersion(value: unknown): value is ProposalVersion {
  return isRecord(value) && strings(value, ['id', 'versionNumber', 'timestamp', 'author', 'summary', 'executiveSummarySnapshot']) &&
    ['AI Auto-Draft', 'Manual Edit', 'AI Compliance Fix', 'AI Compliance Audit', 'OCR Clause Sync', 'Human Review'].includes(value.triggerType as string) &&
    isScore(value.complianceScoreSnapshot) && Array.isArray(value.clausesSnapshot) && value.clausesSnapshot.every(isClause) &&
    (value.discrepanciesSnapshot === undefined || (Array.isArray(value.discrepanciesSnapshot) && value.discrepanciesSnapshot.every(isDiscrepancy)));
}

export function isTender(value: unknown): value is TenderProject {
  return isRecord(value) && strings(value, ['id', 'title', 'Authority', 'rfpNumber', 'budget', 'deadline', 'grade', 'statusLabel', 'ownerName', 'ownerRole', 'AvatarUrl', 'purchaseTimeframe', 'procurementType', 'executiveSummary']) &&
    (value.isDemo === undefined || typeof value.isDemo === 'boolean') &&
    (value.source === undefined || (isRecord(value.source) && strings(value.source, ['provider', 'noticeId', 'url', 'importedAt', 'province']) &&
      /^https:\/\/(?:www\.etenders\.gov\.za|ocds-api\.etenders\.gov\.za)\//.test(value.source.url as string) && Number.isFinite(Date.parse(value.source.importedAt as string)))) &&
    ['qualify', 'develop', 'propose', 'close'].includes(value.stage as string) && isScore(value.leadScore) &&
    typeof value.activeDays === 'number' && Number.isFinite(value.activeDays) &&
    Array.isArray(value.clauses) && value.clauses.every(isClause) &&
    Array.isArray(value.versions) && value.versions.every(isVersion) &&
    Array.isArray(value.discrepancies) && value.discrepancies.every(isDiscrepancy);
}

export function isVaultDocument(value: unknown): value is VaultDocument {
  return isRecord(value) && strings(value, ['id', 'referenceCode', 'title', 'excerpt', 'fullText']);
}

export function isDraftResult(value: unknown): value is Pick<TenderClause, 'proposalResponseText' | 'confidenceScore' | 'aiNote' | 'complianceStatus'> & { versionSummary: string } {
  return isRecord(value) && strings(value, ['proposalResponseText', 'aiNote', 'versionSummary']) &&
    Boolean((value.proposalResponseText as string).trim()) && isScore(value.confidenceScore) && isComplianceStatus(value.complianceStatus);
}

export function isAuditResult(value: unknown): value is { overallComplianceScore: number; grade: string; auditSummary: string; discrepancies: Omit<ComplianceDiscrepancy, 'id' | 'resolved'>[] } {
  return isRecord(value) && isScore(value.overallComplianceScore) && strings(value, ['grade', 'auditSummary']) &&
    Array.isArray(value.discrepancies) && value.discrepancies.every((item) => isRecord(item) && isDiscrepancy({ ...item, id: '', resolved: false }));
}

export function isOcrResult(value: unknown): value is { extractedRawText: string; clauses: Omit<TenderClause, 'id'>[] } {
  return isRecord(value) && typeof value.extractedRawText === 'string' && Array.isArray(value.clauses) &&
    value.clauses.length > 0 && value.clauses.every((item) => isRecord(item) && isClause({ ...item, id: '' }));
}
