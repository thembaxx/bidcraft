import type { TenderDetail, TenderNotice } from '@/lib/discovery/types';
import { isOfficialUrl } from '@/lib/discovery/model';

export type Answer = 'yes' | 'no' | 'unknown';
export type ResultState = 'not_assessed' | 'insufficient_source_information' | 'potential_blocker' | 'needs_confirmation' | 'potential_fit';
export type RequirementKind = 'mandatory' | 'submission' | 'evaluation';
export type CriterionState = 'needs_supplier_input' | 'self_reported' | 'reviewed_supported' | 'possible_conflict' | 'needs_source_confirmation';

export interface SupplierProfile {
  services: string;
  provinces: string[];
  travel: Answer;
  csd: 'registered' | 'in_progress' | 'not_registered' | 'unknown';
  taxGoodStanding: Answer;
  experience: string;
  cidbClass: string;
  cidbGrade: string;
  updatedAt: string;
}
export interface RecordedRequirement {
  id: string;
  label: string;
  kind: RequirementKind;
  excerpt: string;
  sourceUrl: string;
  page: string;
  createdAt: string;
}
export interface Criterion {
  id: string;
  label: string;
  kind: RequirementKind;
  source: 'notice_metadata' | 'supplier_transcribed';
  excerpt: string;
  url: string;
  page: string;
  answer: Answer;
  reviewed: boolean;
  state: CriterionState;
}
export interface RealityCheck {
  tenderId: string;
  sourceFingerprint: string;
  evaluatedAt: string;
  packReviewed: boolean;
  answers: Record<string, Answer>;
  reviewed: Record<string, boolean>;
  manualRequirements: RecordedRequirement[];
  completedActions: string[];
  sourceSnapshot?: TenderDetail;
}
export interface Decision {
  state: ResultState;
  criteria: Criterion[];
  supported: number;
  unanswered: number;
  blockers: number;
  limitations: string[];
  reason: string;
}
export const EMPTY_PROFILE: SupplierProfile = {
  services: '', provinces: [], travel: 'unknown', csd: 'unknown', taxGoodStanding: 'unknown',
  experience: '', cidbClass: '', cidbGrade: '', updatedAt: '',
};
export function emptyCheck(id: string): RealityCheck {
  return { tenderId: id, sourceFingerprint: '', evaluatedAt: '', packReviewed: false, answers: {}, reviewed: {}, manualRequirements: [], completedActions: [] };
}

/** A noncryptographic fingerprint for comparing *visible* notice fields, not for authenticating documents. */
export function sourceFingerprint(detail: TenderDetail): string {
  const canonical = JSON.stringify({
    id: detail.id, reference: detail.reference, closesAt: detail.closesAt, briefing: detail.briefing,
    briefingAt: detail.briefingAt, conditions: detail.conditions, description: detail.description,
    sourceStatus: detail.sourceStatus, deadlineConflict: detail.deadlineConflict,
    documents: detail.documents.map(doc => [doc.id, doc.title, doc.url]).sort((a, b) => a[0].localeCompare(b[0])),
  });
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) hash = Math.imul(hash ^ canonical.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function sourceChanges(previous: TenderDetail, current: TenderDetail): string[] {
  const changes: string[] = [];
  if (previous.closesAt !== current.closesAt) changes.push('Closing date or time changed');
  if (previous.briefing !== current.briefing || previous.briefingAt !== current.briefingAt) changes.push('Briefing requirement or time changed');
  if (previous.conditions !== current.conditions) changes.push('Published conditions text changed');
  if (previous.description !== current.description) changes.push('Description changed');
  if (previous.sourceStatus !== current.sourceStatus) changes.push('Source status changed');
  const docs = (d: TenderDetail) => JSON.stringify(d.documents.map(x => [x.id, x.title, x.url]).sort((a, b) => a[0].localeCompare(b[0])));
  if (docs(previous) !== docs(current)) changes.push('Linked document listing changed; review attachments');
  return changes;
}
export function officialRequirementLink(url: string): boolean {
  return isOfficialUrl(url);
}
export function evaluateRealityCheck(notice: TenderNotice | null, detail: TenderDetail | null, check: RealityCheck, sourceCurrent: boolean): Decision {
  const criteria: Criterion[] = [];
  const fingerprint = detail ? sourceFingerprint(detail) : '';
  const stale = Boolean(check.sourceFingerprint && fingerprint && check.sourceFingerprint !== fingerprint);
  const limitations: string[] = [];
  if (notice?.briefing === 'required' || detail?.briefing === 'required') {
    const answer = check.answers.briefing || 'unknown';
    const reviewed = check.reviewed.briefing === true;
    criteria.push({
      id: 'briefing', label: 'Attend the compulsory briefing', kind: 'mandatory', source: 'notice_metadata',
      excerpt: 'Treasury eTender listing marks the briefing as compulsory. Confirm this in the original documents and check for amendments.',
      url: detail?.sourceUrl || notice?.sourceUrl || '', page: '', answer, reviewed,
      state: answer === 'no' ? 'possible_conflict' : answer === 'yes' ? (reviewed ? 'reviewed_supported' : 'self_reported') : 'needs_supplier_input',
    });
  }
  for (const r of check.manualRequirements) {
    const answer = check.answers[r.id] || 'unknown', reviewed = check.reviewed[r.id] === true;
    const citationReady = officialRequirementLink(r.sourceUrl) && r.excerpt.trim().length >= 12;
    criteria.push({
      id: r.id, label: r.label, kind: r.kind, source: 'supplier_transcribed',
      excerpt: r.excerpt, url: r.sourceUrl, page: r.page, answer, reviewed,
      state: !citationReady ? 'needs_source_confirmation' : answer === 'no' && r.kind === 'mandatory' ? 'possible_conflict' :
        answer === 'yes' ? (reviewed ? 'reviewed_supported' : 'self_reported') : 'needs_supplier_input',
    });
  }
  const mandatory = criteria.filter(item => item.kind === 'mandatory');
  const blockers = mandatory.filter(item => item.state === 'possible_conflict').length;
  const supported = mandatory.filter(item => item.state === 'reviewed_supported').length;
  const unanswered = mandatory.filter(item => item.state !== 'reviewed_supported' && item.state !== 'possible_conflict').length;
  if (!detail || !sourceCurrent) limitations.push('Current source details could not be confirmed. Saved metadata can be incomplete.');
  if (detail && detail.deadlineConflict) limitations.push('Official listing and OCDS data disagree about the closing date.');
  if (stale) limitations.push('The source notice has changed since this assessment. Recheck the requirements.');
  if (!detail?.documents.length) limitations.push('No official tender document links were available to examine.');
  else limitations.push('Bidcraft has not automatically read the linked PDF contents. Review the actual documents.');
  if (!check.packReviewed) limitations.push('You have not yet confirmed that you read the complete tender pack and recorded its mandatory requirements.');
  if (check.manualRequirements.some(r => !officialRequirementLink(r.sourceUrl) || r.excerpt.trim().length < 12)) limitations.push('Some user-recorded requirements lack a usable official source reference.');
  let state: ResultState = 'needs_confirmation';
  let reason = 'Some supplier answers or supporting evidence need human confirmation.';
  if (!notice || !detail || !sourceCurrent || detail.deadlineConflict || stale || !detail.documents.length) {
    state = 'insufficient_source_information';
    reason = 'We cannot establish the complete mandatory requirements from confirmed, current source documents.';
  } else if (blockers > 0) {
    state = 'potential_blocker';
    reason = 'One or more of your answers conflict with a recorded mandatory condition. Check the original tender before proceeding.';
  } else if (!check.packReviewed || !mandatory.some(item => item.source === 'supplier_transcribed')) {
    state = 'insufficient_source_information';
    reason = 'Review the original tender pack and record at least one mandatory requirement with an official document excerpt. A briefing flag alone cannot establish suitability.';
  } else if (mandatory.some(item => item.source === 'supplier_transcribed' && item.state === 'needs_source_confirmation')) {
    state = 'insufficient_source_information';
    reason = 'One or more recorded mandatory requirements lack an official citation.';
  } else if (mandatory.every(item => item.state === 'reviewed_supported')) {
    state = 'potential_fit';
    reason = 'No reported conflicts in the mandatory conditions you recorded and reviewed. This is not official eligibility verification.';
  }
  return { state, criteria, supported, unanswered, blockers, limitations, reason };
}

/** Advisory only: supplier self-report is not verified against official procurement criteria. */
export function supplierContext(notice: TenderNotice | null, profile: SupplierProfile): string[] {
  const notes: string[] = [];
  if (!profile.services.trim()) notes.push('Describe the services you offer and compare them with the original scope of work.');
  else notes.push('Your service capabilities are self-reported. Compare them with the tender scope and technical requirements.');
  if (notice?.province && profile.provinces.length && !profile.provinces.includes(notice.province) && !profile.provinces.includes('National')) {
    notes.push(profile.travel === 'no'
      ? 'This tender is outside the province you selected, and you reported that you cannot travel. Review delivery and onsite obligations.'
      : 'This tender is outside your selected province. Confirm that you can fulfil location and delivery obligations.');
  }
  if (profile.csd === 'not_registered' || profile.csd === 'in_progress')
    notes.push('You reported that CSD registration is not complete. Check whether this tender requires it and confirm directly on CSD.');
  if (profile.taxGoodStanding === 'no')
    notes.push('You reported that SARS Tax Compliance Status is not in good standing. Check whether and when this tender requires it.');
  if (profile.experience.trim()) notes.push('Your previous experience is self-described; check references, minimum project values and specific proof requested.');
  if (profile.cidbClass.trim() || profile.cidbGrade.trim())
    notes.push('Your cidb details are self-reported. Verify both the class and grade against the specific construction tender.');
  return notes;
}

export function resultLabel(state: ResultState): string {
  return ({
    not_assessed: 'Not assessed', insufficient_source_information: 'Insufficient source information',
    potential_blocker: 'Potential blocker', needs_confirmation: 'Needs confirmation', potential_fit: 'Potential fit',
  })[state];
}
