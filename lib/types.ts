export type PipelineStage = 'qualify' | 'develop' | 'propose' | 'close';

export interface TenderClause {
  id: string;
  code: string;
  title: string;
  mandatory: boolean;
  category: 'Legal & Statutory' | 'Technical Architecture' | 'Financial & SLA' | 'Security & ISO';
  originalText: string;
  proposalSectionTitle: string;
  proposalResponseText: string;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
  confidenceScore: number;
  matchedVaultDocIds: string[];
  aiNote: string;
}

export interface ProposalVersion {
  id: string;
  versionNumber: string;
  timestamp: string;
  author: string;
  triggerType: 'AI Auto-Draft' | 'Manual Edit' | 'AI Compliance Fix' | 'AI Compliance Audit' | 'OCR Clause Sync';
  summary: string;
  complianceScoreSnapshot: number;
  clausesSnapshot: TenderClause[];
  executiveSummarySnapshot: string;
  discrepanciesSnapshot?: ComplianceDiscrepancy[];
}

export interface VaultDocument {
  id: string;
  title: string;
  category: 'Past Winning Bid' | 'Statutory & Legal' | 'ISO & Security Cert' | 'Financial Audit';
  dateUpdated: string;
  referenceCode: string;
  excerpt: string;
  fullText: string;
  embedding: number[];
  similarityScore?: number;
}

export interface ComplianceDiscrepancy {
  id: string;
  clauseCode: string;
  severity: 'critical' | 'warning' | 'verified';
  issueTitle: string;
  tenderRequirement: string;
  currentProposalText: string;
  vaultEvidenceCited: string;
  recommendedFix: string;
  resolved: boolean;
}

export interface TenderProject {
  id: string;
  title: string;
  Authority: string;
  rfpNumber: string;
  budget: string;
  deadline: string;
  activeDays: number;
  stage: PipelineStage;
  leadScore: number;
  grade: string;
  statusLabel: string;
  ownerName: string;
  ownerRole: string;
  AvatarUrl: string;
  purchaseTimeframe: string;
  procurementType: string;
  executiveSummary: string;
  clauses: TenderClause[];
  versions: ProposalVersion[];
  discrepancies: ComplianceDiscrepancy[];
}
