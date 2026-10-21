'use client';

import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import { AnimatedTabs } from './ui/animated-tabs';
import { Alert } from './ui/alert';
import { Dialog } from './ui/dialog';
import { BrandLogoMark } from './brand-logo';
import dynamic from 'next/dynamic';
import { recordClauseReview } from '@/lib/bid-anatomy';
import type { ClauseReview } from '@/lib/types';
const BidAnatomyPanel = dynamic(() => import('./bid-anatomy/panel'), { loading: () => <div role="status" className="rounded-3xl bg-white p-8 text-sm text-neutral-500 dark:bg-[#161918]">Opening the inspection bench…</div> });
import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  House,
  ClockCounterClockwise,
  PushPin,
  RocketLaunch,
  SquaresFour,
  Pulse,
  Buildings,
  MagnifyingGlass,
  ArrowsClockwise,
  CalendarBlank,
  FloppyDisk,
  Plus,
  ShieldCheck,
  FilePdf,
  Sparkle,
  Sun,
  Moon,
  LockSimple,
  CheckCircle,
  Columns,
  Database,
  Check,
  WarningCircle,
  EnvelopeSimple,
  PhoneCall,
} from '@phosphor-icons/react';
import {
  INITIAL_TENDERS,
  INITIAL_VAULT_DOCS,
} from '@/lib/initial-data';
import {
  ComplianceDiscrepancy,
  PipelineStage,
  ProposalVersion,
  TenderClause,
  TenderProject,
  VaultDocument,
} from '@/lib/types';
import { ComplianceScoreGauge } from '@/components/compliance-score-gauge';
import { DocumentComparisonTool } from '@/components/document-comparison-tool';
import { VersionControlPanel } from '@/components/version-control-panel';
import { ComplianceVaultHub } from '@/components/compliance-vault-hub';
import { PWAInstallControl, OfflineBanner } from '@/components/pwa-controls';

import { isRecord, isTender, isDraftResult, isAuditResult, isOcrResult } from '@/lib/validation';
import { commitProposal, restoreProposal } from '@/lib/proposals';
import { rankVaultDocuments } from '@/lib/search';

const STORAGE_KEY_TENDERS = 'quora_bid_architect_tenders_v1';
const STORAGE_KEY_THEME = 'quora_bid_architect_theme_v1';

type ActiveTab = 'anatomy' | 'summary' | 'comparison' | 'compliance' | 'versions';

const STORAGE_KEY_SELECTION = 'quora_bid_architect_selection_v1';
const subscribeToHydration = () => () => {};

function readSavedTenders(): TenderProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TENDERS);
    if (!raw) return INITIAL_TENDERS;
    const saved: unknown = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length > 0 && saved.every(isTender)) return saved;
    localStorage.setItem(`${STORAGE_KEY_TENDERS}_recovery`, raw);
  } catch { /* Storage may be disabled or contain invalid JSON. */ }
  return INITIAL_TENDERS;
}

function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

async function requestAI(action: string, payload: unknown): Promise<unknown> {
  const response = await fetch('/api/tender-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    signal: AbortSignal.timeout(60_000),
  });
  const data: unknown = await response.json();
  if (!response.ok || !isRecord(data) || !('result' in data)) {
    throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'The request failed. Please try again.');
  }
  return data.result;
}

export default function BidcraftWorkspace() {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  return hydrated ? <BidWorkspace /> : <div role="status" className="p-8">Opening Bidcraft…</div>;
}

function BidWorkspace() {
  const reducedMotion = useReducedMotion();
  const [tenders, setTenders] = useState<TenderProject[]>(readSavedTenders);
  const [selectedTenderId, setSelectedTenderId] = useState(() => readPreference(STORAGE_KEY_SELECTION) || INITIAL_TENDERS[0].id);
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>(INITIAL_VAULT_DOCS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [comparisonClauseId, setComparisonClauseId] = useState<string | undefined>();
  const [searchFilter, setSearchFilter] = useState('');
  const [darkMode, setDarkMode] = useState(() => readPreference(STORAGE_KEY_THEME) === 'dark');
  const [isAuditing, setIsAuditing] = useState(false);
  const [draftingClauseId, setDraftingClauseId] = useState<string | null>(null);
  const [isSearchingVectors, setIsSearchingVectors] = useState(false);
  const [usedLiveEmbedding, setUsedLiveEmbedding] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrExtractions, setOcrExtractions] = useState<Record<string, string>>({});
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showNewTenderModal, setShowNewTenderModal] = useState(false);
  const [newTenderTitle, setNewTenderTitle] = useState('');
  const [newTenderAuthority, setNewTenderAuthority] = useState('');
  const [newTenderBudget, setNewTenderBudget] = useState('');
  const aiBusy = useRef(false);
  const tendersRef = useRef(tenders);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { tendersRef.current = tenders; }, [tenders]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_TENDERS, JSON.stringify(tenders)); }
    catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report external storage failure; this does not change the persisted state.
      setStatusToast('Browser storage is unavailable or full. Export your proposal to keep a copy.');
    }
  }, [tenders]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(STORAGE_KEY_THEME, darkMode ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ }
  }, [darkMode]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_SELECTION, selectedTenderId); } catch { /* Selection remains available for this session. */ }
  }, [selectedTenderId]);

  const toggleTheme = () => setDarkMode((previous) => !previous);
  const notify = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setStatusToast(message);
    toastTimer.current = setTimeout(() => setStatusToast(null), 6000);
  };
  const showAIError = (error: unknown) => notify(error instanceof Error ? error.message : 'AI is unavailable. Please try again.');
  const activeTender = useMemo(() => tenders.find((tender) => tender.id === selectedTenderId) || tenders[0], [tenders, selectedTenderId]);
  const filteredTenders = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return tenders.filter((tender) => [tender.title, tender.Authority, tender.rfpNumber, tender.ownerName].some((text) => text.toLowerCase().includes(query)));
  }, [tenders, searchFilter]);

  const updateTender = (id: string, transform: (tender: TenderProject) => TenderProject) => {
    setTenders((current) => current.map((tender) => tender.id === id ? transform(tender) : tender));
  };

  const handleUpdateClause = (clauseId: string, text: string, summary: string, trigger: 'Manual Edit' | 'AI Auto-Draft') => {
    updateTender(activeTender.id, (tender) => commitProposal(tender, {
      clauses: tender.clauses.map((clause) => clause.id === clauseId ? {
        ...clause, review: undefined, proposalResponseText: text, complianceStatus: 'partial', confidenceScore: 0,
        aiNote: 'Manually edited. Run a compliance audit to verify this response.',
      } : clause),
      discrepancies: tender.discrepancies.map((flag) => flag.clauseCode === tender.clauses.find((clause) => clause.id === clauseId)?.code ? { ...flag, currentProposalText: text, resolved: false } : flag),
    }, trigger, summary));
    notify('Saved a new version. The edited response needs a compliance review.');
  };

  const handleDraftClauseWithAI = async (clause: TenderClause, mode: string) => {
    if (aiBusy.current) return;
    aiBusy.current = true;
    const tenderId = activeTender.id;
    setDraftingClauseId(clause.id);
    try {
      const result = await requestAI('draft_clause', { clause, vaultDocs, mode });
      if (!isDraftResult(result)) throw new Error('AI returned an invalid draft. Your proposal has not been changed.');
      const latest = tendersRef.current.find((tender) => tender.id === tenderId)?.clauses.find((item) => item.id === clause.id);
      if (latest?.proposalResponseText !== clause.proposalResponseText) throw new Error('The clause changed while AI was drafting. Retry using the latest text.');
      updateTender(tenderId, (tender) => commitProposal(tender, {
        clauses: tender.clauses.map((item) => item.id === clause.id ? { ...item, ...result, review: undefined } : item),
        discrepancies: tender.discrepancies.map((flag) => flag.clauseCode === clause.code ? { ...flag, currentProposalText: result.proposalResponseText, resolved: false } : flag),
      }, 'AI Auto-Draft', result.versionSummary));
      notify(`Saved AI draft for ${clause.code}. Review its evidence before submission.`);
    } catch (error) { showAIError(error); }
    finally { aiBusy.current = false; setDraftingClauseId(null); }
  };

  const handleRunComplianceAudit = async () => {
    if (aiBusy.current) return;
    if (!activeTender.clauses.length) { notify('Add tender clauses before running an audit.'); return; }
    aiBusy.current = true;
    const source = activeTender;
    setIsAuditing(true);
    setActiveTab('compliance');
    try {
      const result = await requestAI('compliance_audit', { tenderTitle: source.title, clauses: source.clauses, vaultDocs });
      if (!isAuditResult(result)) throw new Error('AI returned an invalid audit. Your proposal has not been changed.');
      if (tendersRef.current.find((tender) => tender.id === source.id)?.clauses !== source.clauses) throw new Error('The proposal changed during the audit. Run the audit again.');
      const discrepancies = result.discrepancies.map((flag) => ({ ...flag, id: `disc-${crypto.randomUUID()}`, resolved: flag.severity === 'verified' }));
      updateTender(source.id, (tender) => commitProposal(tender, {
        leadScore: result.overallComplianceScore, grade: result.grade, discrepancies,
        clauses: tender.clauses.map((clause) => {
          const flags = discrepancies.filter((flag) => flag.clauseCode === clause.code && !flag.resolved);
          return { ...clause, review: flags.length ? undefined : clause.review, complianceStatus: flags.some((flag) => flag.severity === 'critical') ? 'non-compliant' : flags.length ? 'partial' : 'compliant' };
        }),
      }, 'AI Compliance Audit', result.auditSummary));
      notify(`AI audit complete: ${result.overallComplianceScore}% (${result.grade}).`);
    } catch (error) { showAIError(error); }
    finally { aiBusy.current = false; setIsAuditing(false); }
  };

  const handleApplyComplianceFix = (flag: ComplianceDiscrepancy) => {
    if (flag.resolved || flag.severity === 'verified' || !flag.recommendedFix.trim()) return;
    if (!activeTender.clauses.some((clause) => clause.code === flag.clauseCode)) { notify('This flag has no matching clause. Run the audit again.'); return; }
    updateTender(activeTender.id, (tender) => commitProposal(tender, {
      clauses: tender.clauses.map((clause) => clause.code === flag.clauseCode ? {
        ...clause, review: undefined, proposalResponseText: flag.recommendedFix, complianceStatus: 'partial', confidenceScore: 0,
        aiNote: `Suggested remediation using ${flag.vaultEvidenceCited}. Awaiting compliance review.`,
      } : clause),
      discrepancies: tender.discrepancies.map((item) => item.id === flag.id ? { ...item, currentProposalText: flag.recommendedFix, resolved: true } : item),
    }, 'AI Compliance Fix', `Applied suggested wording for ${flag.clauseCode}; review required`));
    notify(`Applied suggested wording for ${flag.clauseCode}. Run an audit to verify it.`);
  };

  const handleRecordReview = (clauseId: string, outcome: ClauseReview['outcome'], note: string) => {
    if (aiBusy.current) { notify('Wait for the AI request to finish before recording a review.'); return false; }
    const current = tendersRef.current.find((tender) => tender.id === activeTender.id);
    if (!current) return false;
    try {
      const updated = recordClauseReview(current, clauseId, vaultDocs, outcome, note);
      updateTender(current.id, () => updated);
      notify(outcome === 'approved' ? 'Human review recorded with a new proposal snapshot.' : 'Requested changes saved with a new proposal snapshot.');
      return true;
    } catch (error) { notify(error instanceof Error ? error.message : 'The review could not be saved.'); return false; }
  };
  const handleEvidenceChange = (clauseId: string, ids: string[]) => {
    const allowed = [...new Set(ids)].filter((id) => vaultDocs.some((doc) => doc.id === id));
    updateTender(activeTender.id, (tender) => commitProposal(tender, {
      clauses: tender.clauses.map((clause) => clause.id === clauseId ? { ...clause, matchedVaultDocIds: allowed, review: undefined } : clause),
      leadScore: tender.leadScore, grade: tender.grade,
    }, 'Manual Edit', 'Updated clause evidence links; human review required'));
    notify('Evidence links saved. The previous human review was cleared.');
  };
  const openClauseComparison = (clauseId: string) => { setComparisonClauseId(clauseId); setActiveTab('comparison'); };

  const handleRestoreVersion = (version: ProposalVersion) => {
    updateTender(activeTender.id, (tender) => restoreProposal(tender, version));
    notify(`Restored ${version.versionNumber} as a new version.`);
  };
  const handleCreateCheckpoint = (label: string) => {
    updateTender(activeTender.id, (tender) => commitProposal(tender, {}, 'Manual Edit', label));
    notify(`Created snapshot: ${label}`);
  };

  const handleVectorSearch = async (query: string) => {
    if (!query.trim() || isSearchingVectors) return;
    setIsSearchingVectors(true);
    try {
      let ranked: { id: string; similarityScore: number }[];
      let live = false;
      try {
        const result = await requestAI('vector_search', { query, vaultDocs });
        if (!isRecord(result) || !Array.isArray(result.ranked) || !result.ranked.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.similarityScore === 'number' && Number.isFinite(item.similarityScore))) throw new Error('Invalid search result');
        ranked = result.ranked as typeof ranked;
        live = result.usedLiveEmbedding === true;
      } catch { ranked = rankVaultDocuments(query, vaultDocs); }
      const scores = new Map(ranked.map((item) => [item.id, item.similarityScore]));
      setVaultDocs((docs) => docs.map((doc) => ({ ...doc, similarityScore: scores.get(doc.id) ?? 0 })).sort((a, b) => b.similarityScore - a.similarityScore));
      setUsedLiveEmbedding(live);
      notify(live ? 'Vault documents ranked using live embeddings.' : 'Vault documents ranked using local text similarity.');
    } finally { setIsSearchingVectors(false); }
  };

  const handleOcrIngest = async (params: { base64Data?: string; mimeType?: string; rawText?: string }) => {
    if (aiBusy.current) return;
    aiBusy.current = true;
    const tenderId = activeTender.id;
    setIsOcrRunning(true);
    try {
      const result = await requestAI('ocr_extract', { ...params, vaultDocs });
      if (!isOcrResult(result)) throw new Error('AI returned invalid extracted clauses. Your proposal has not been changed.');
      const clauses = result.clauses.map((clause) => ({ ...clause, id: `cl-ocr-${crypto.randomUUID()}` }));
      const existingCodes = tendersRef.current.find((tender) => tender.id === tenderId)?.clauses.map((clause) => clause.code) ?? [];
      if (new Set(clauses.map((clause) => clause.code)).size !== clauses.length || clauses.some((clause) => existingCodes.includes(clause.code))) throw new Error('Extraction contains duplicate clause codes. Review the existing clauses before importing again.');
      updateTender(tenderId, (tender) => commitProposal(tender, { clauses: [...tender.clauses, ...clauses] }, 'OCR Clause Sync', `Imported ${clauses.length} clauses from tender document`));
      setOcrExtractions((current) => ({ ...current, [tenderId]: result.extractedRawText }));
      notify(`Imported ${clauses.length} clauses. Review the extracted text and draft responses.`);
    } catch (error) { showAIError(error); }
    finally { aiBusy.current = false; setIsOcrRunning(false); }
  };

  const handleSelectStage = (stage: PipelineStage) => {
    updateTender(activeTender.id, (tender) => ({ ...tender, stage }));
    notify(`Moved tender to ${stage.toUpperCase()}.`);
  };
  const handleExportProposal = () => {
    const md = `# ${activeTender.title}\n**Issuing Authority:** ${activeTender.Authority}\n**RFP Reference:** ${activeTender.rfpNumber}\n**Contract Budget:** ${activeTender.budget}\n**Compliance Score:** ${activeTender.leadScore}% (${activeTender.grade})\n**Active Version:** ${activeTender.versions[0]?.versionNumber || 'No snapshots'}\n\n## Executive Summary\n${activeTender.executiveSummary}\n\n## Proposal Responses\n${activeTender.clauses.map((clause) => `### [${clause.code}] ${clause.proposalSectionTitle}\n**Requirement:** ${clause.originalText}\n\n**Response (${clause.complianceStatus}; ${clause.confidenceScore}% confidence):**\n${clause.proposalResponseText}\n\n**Human review:** ${clause.review ? `${clause.review.outcome} by ${clause.review.reviewer} on ${clause.review.reviewedAt} — ${clause.review.note}` : 'Not recorded'}\n\n*AI note:* ${clause.aiNote}`).join('\n\n---\n\n')}`;
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTender.rfpNumber.replace(/[^a-z0-9_-]/gi, '_')}-Proposal.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Exported proposal as Markdown.');
  };
  const handleCreateNewTender = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTenderTitle.trim()) return;
    const created: TenderProject = {
      id: `tender-${crypto.randomUUID()}`, title: newTenderTitle.trim(), Authority: newTenderAuthority.trim() || 'Not specified',
      rfpNumber: `RFP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, budget: newTenderBudget.trim() || 'Not specified',
      deadline: 'Not specified', activeDays: 0, stage: 'qualify', leadScore: 0, grade: 'Not audited', statusLabel: 'New Intake',
      ownerName: 'Bid Team', ownerRole: 'Bid Architect', AvatarUrl: '', purchaseTimeframe: 'Not specified', procurementType: 'Not specified',
      executiveSummary: '', clauses: [], versions: [], discrepancies: [],
    };
    setTenders((current) => [created, ...current]);
    setSelectedTenderId(created.id);
    setSearchFilter('');
    setActiveTab('compliance');
    setShowNewTenderModal(false);
    setNewTenderTitle(''); setNewTenderAuthority(''); setNewTenderBudget('');
    notify(`Created ${created.rfpNumber}. Import tender clauses to get started.`);
  };

  const stages: { key: PipelineStage; label: string }[] = [
    { key: 'qualify', label: 'Qualify (3 D)' },
    { key: 'develop', label: 'Develop' },
    { key: 'propose', label: 'Propose' },
    { key: 'close', label: 'Close' },
  ];

  return (
    <MotionConfig reducedMotion="user"><div id="workspace" className="scroll-mt-4 min-h-dvh flex flex-col bg-[#F8F6EF] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-[#F5F7F6] pb-20 lg:pb-6">
      <OfflineBanner />

      <header className="sticky top-0 z-30 border-y border-neutral-200/80 bg-[#F8F6EF]/95 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-[#0D0F0E]/95 lg:px-8">
        <div className="mx-auto flex max-w-[1536px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><BrandLogoMark size={30} /><div><p className="text-xs font-bold">The bid studio</p><p className="mt-0.5 text-[10px] text-neutral-500">Your evidence. Your edge.</p></div></div>
          <div className="flex shrink-0 items-center gap-2"><PWAInstallControl /><button type="button" onClick={toggleTheme} aria-label="Toggle dark and light theme" className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#161918]">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button></div>
        </div>
      </header>

      <div className="fixed bottom-20 right-4 z-50 max-w-[calc(100vw-2rem)] lg:bottom-6" aria-live="polite">
        <AnimatePresence mode="wait">{statusToast && <motion.div key={statusToast} initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
          <Alert dismissible className="max-w-lg bg-white text-xs shadow-lg dark:bg-[#161918]">{statusToast}</Alert>
        </motion.div>}</AnimatePresence>
      </div>

      {/* Main 3-Pane Workspace Canvas directly inspired by IMG_5846_9eff926d.jpeg */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Pane 1 (Left Sidebar - 2 Cols on Desktop): Menu & Bid Accelerator Navigation */}
        <aside className="hidden lg:flex lg:col-span-2 flex-col justify-between rounded-3xl bg-[#E7E9E8] dark:bg-[#131615] p-4 min-h-[760px]">
          <div className="space-y-6">
            <div>
              <div className="px-3 py-1 text-lg font-bold text-[#0D0F0E] dark:text-white">
                Menu
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'summary'
                      ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5'
                  }`}
                >
                  <House size={17} weight="bold" />
                  <span>Bid Hub</span>
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'versions'
                      ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5'
                  }`}
                >
                  <ClockCounterClockwise size={17} weight="bold" />
                  <span>Version Log</span>
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'comparison'
                      ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5'
                  }`}
                >
                  <PushPin size={17} weight="bold" />
                  <span>Clause Diff</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                My Work
              </div>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-full bg-[#DDFB82] text-[#0D0F0E] text-xs font-bold flex items-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <RocketLaunch size={17} weight="bold" />
                  <span className="truncate">RFP Accelerator</span>
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <SquaresFour size={17} />
                  <span>50/50 Compare</span>
                </button>
                <button
                  onClick={handleRunComplianceAudit}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <Pulse size={17} />
                  <span>Compliance Audit</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                Knowledge Base
              </div>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <Buildings size={17} />
                  <span>Vector Vault ({vaultDocs.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Left Sidebar Bottom Quick Summary */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1A1E1D] text-xs space-y-1.5">
            <div className="font-bold text-[#0D0F0E] dark:text-white">
              Evidence library
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Sample records are included. Verify all evidence and commitments before submission.
            </p>
          </div>
        </aside>

        {/* Pane 2 (Middle Column - 3 Cols on Desktop): "My Work" Active Tenders Queue inspired by IMG_5846 & IMG_5847 */}
        <section className="min-w-0 lg:col-span-3 rounded-3xl bg-white/75 dark:bg-[#141716] border border-neutral-200/70 dark:border-neutral-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#0D0F0E] dark:text-white">
              My Tenders
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleRunComplianceAudit()}
                title="Refresh Compliance Scores"
                className="min-h-[36px] min-w-[36px] rounded-full bg-[#F8F6EF] dark:bg-[#1E2221] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-[#DDFB82] hover:text-[#0D0F0E] transition-colors cursor-pointer"
              >
                <ArrowsClockwise size={16} weight="bold" />
              </button>
              <button
                onClick={() => setShowNewTenderModal(true)}
                title="Ingest New Tender RFP"
                className="min-h-[36px] min-w-[36px] rounded-full bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter tenders by authority or RFP ID..."
              className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white focus:outline-hidden focus:border-[#168B7A]"
            />
          </div>

          <div className="text-center text-[11px] font-semibold text-neutral-400">
            Active Procurement Queue
          </div>

          {/* Tender Cards Queue */}
          <div className="space-y-3">
            {filteredTenders.length === 0 && <p role="status" className="py-8 text-center text-xs text-neutral-500">No tenders match your search.</p>}
            {filteredTenders.map((tender) => {
              const isSelected = tender.id === activeTender.id;
              return (
                <div
                  key={tender.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${tender.title}`}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTenderId(tender.id); } }}
                  onClick={() => setSelectedTenderId(tender.id)}
                  className={`rounded-3xl p-4 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#DDFB82] text-[#0D0F0E] border-transparent shadow-sm'
                      : 'bg-[#F6F7F6] dark:bg-[#1A1E1D] text-[#0D0F0E] dark:text-white border-neutral-200/60 dark:border-neutral-800 hover:border-[#168B7A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#0D0F0E] text-[#DDFB82]'
                            : 'bg-[#168B7A]/20 text-[#168B7A]'
                        }`}
                      >
                        {tender.ownerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">
                          {tender.ownerName}
                        </h3>
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? 'text-[#0D0F0E]/80 font-medium'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {tender.title}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border border-[#0D0F0E]/20 text-[#0D0F0E]'
                          : 'border border-neutral-300 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      <EnvelopeSimple size={15} weight="bold" />
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-medium">
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/90 text-[#0D0F0E] font-semibold'
                            : 'bg-white dark:bg-[#0D0F0E] text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {tender.rfpNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono tabular-nums ${
                          isSelected
                            ? 'bg-white/90 text-[#0D0F0E]'
                            : 'bg-white dark:bg-[#0D0F0E] text-neutral-500'
                        }`}
                      >
                        {tender.budget}
                      </span>
                    </div>

                    {/* Circular Score Badge matching IMG_5847_a89e39da.jpeg */}
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-mono text-xs font-bold tabular-nums ${
                        isSelected
                          ? 'bg-[#0D0F0E] text-white'
                          : tender.leadScore >= 85
                          ? 'bg-[#168B7A]/20 text-[#168B7A]'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tender.leadScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pane 3 (Right Main Studio - 7 Cols on Desktop): Active Tender Architect Workspace */}
        <section className="min-w-0 lg:col-span-7 space-y-4">
          {/* Top Lime-Tinted Action Ribbon inspired directly by IMG_5846 & IMG_5849 */}
          <div className="rounded-3xl bg-linear-to-r from-[#DDFB82]/70 via-[#DDFB82]/35 to-white dark:from-[#DDFB82]/20 dark:via-[#168B7A]/15 dark:to-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() =>
                  handleCreateCheckpoint(
                    `Manual Save by ${activeTender.ownerName}`
                  )
                }
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-white dark:bg-[#161918] text-[#0D0F0E] dark:text-white hover:bg-[#DDFB82] dark:hover:bg-[#DDFB82] dark:hover:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                <FloppyDisk size={15} weight="bold" className="text-[#168B7A]" />
                <span>Save Snapshot</span>
              </button>

              <button
                onClick={() => setShowNewTenderModal(true)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-white dark:bg-[#161918] text-[#0D0F0E] dark:text-white hover:bg-[#DDFB82] dark:hover:bg-[#DDFB82] dark:hover:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                <Plus size={15} weight="bold" className="text-[#168B7A]" />
                <span>New Bid</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-white dark:bg-[#161918] text-[#0D0F0E] dark:text-white hover:bg-[#DDFB82] dark:hover:bg-[#DDFB82] dark:hover:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                <Columns size={15} weight="bold" className="text-[#168B7A]" />
                <span>50/50 Compare</span>
              </button>

              <button
                onClick={handleRunComplianceAudit}
                disabled={isAuditing}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#DDFB82] text-[#0D0F0E] hover:bg-[#e1f673] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                <ShieldCheck size={16} weight="bold" />
                <span>{isAuditing ? 'Checking...' : 'Check Compliance'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportProposal}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0D0F0E] text-white dark:bg-white dark:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePdf size={15} weight="bold" />
                <span>Export Proposal</span>
              </button>
            </div>
          </div>

          {/* Tender Identity Header & Opportunity Sales Process Stepper (from IMG_5846 & IMG_5847) */}
          <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                    {activeTender.rfpNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTender.Authority}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#168B7A] dark:text-[#DDFB82] font-semibold">
                    Version {activeTender.versions[0]?.versionNumber || 'v1.0'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0F0E] dark:text-white text-balance">
                  {activeTender.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-neutral-400 block">Deadline</span>
                  <span className="font-mono font-semibold text-[#0D0F0E] dark:text-white tabular-nums">
                    {activeTender.deadline}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Contract Value</span>
                  <span className="font-mono font-bold text-[#168B7A] dark:text-[#DDFB82] tabular-nums">
                    {activeTender.budget}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Bid Architect</span>
                  <span className="font-semibold text-[#0D0F0E] dark:text-white">
                    {activeTender.ownerName}
                  </span>
                </div>
              </div>
            </div>

            {/* Opportunity Sales Process Stepper Pill Bar (Direct match to IMG_5847_a89e39da.jpeg) */}
            <div className="rounded-2xl bg-linear-to-r from-[#168B7A]/20 via-[#DDFB82]/40 to-[#F8F9F8] dark:from-[#168B7A]/30 dark:via-[#DDFB82]/15 dark:to-[#111413] p-4">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-[#0D0F0E] dark:text-white">
                  Tender Bid Lifecycle Process
                </span>
                <span className="text-neutral-600 dark:text-neutral-300 font-mono tabular-nums">
                  Active for {activeTender.activeDays} Days · {activeTender.clauses.length} Clauses Tracked
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {stages.map((st, idx) => {
                  const currentIdx = stages.findIndex(
                    (s) => s.key === activeTender.stage
                  );
                  const isCompletedOrActive = idx <= currentIdx;
                  const isCurrent = st.key === activeTender.stage;

                  return (
                    <button
                      key={st.key}
                      onClick={() => handleSelectStage(st.key)}
                      className={`min-h-[44px] rounded-2xl px-3 py-2 flex flex-col items-start justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#168B7A] text-white font-bold shadow-xs'
                          : isCompletedOrActive
                          ? 'bg-white/90 dark:bg-[#1E2221] text-[#0D0F0E] dark:text-white font-semibold'
                          : 'bg-white/50 dark:bg-white/5 text-neutral-500'
                      }`}
                    >
                      <span className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                        {isCompletedOrActive ? (
                          <Check size={13} weight="bold" />
                        ) : (
                          <LockSimple size={13} />
                        )}
                      </span>
                      <span className="text-xs mt-1.5 whitespace-nowrap truncate w-full text-left">
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatedTabs activeTab={activeTab} onChange={setActiveTab} tabs={[
              { id: 'summary', label: 'Overview' },
              { id: 'anatomy', label: 'Bid Anatomy' },
              { id: 'comparison', label: 'Clause comparison', badge: activeTender.clauses.length },
              { id: 'compliance', label: 'Compliance & vault', badge: activeTender.discrepancies.filter((flag) => !flag.resolved && flag.severity !== 'verified').length },
              { id: 'versions', label: 'History', badge: activeTender.versions.length },
            ]} />
          </div>

          {/* Tab Content Switching */}
          <AnimatePresence mode="wait" initial={false}><motion.div key={`${activeTender.id}-${activeTab}`} role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
              {/* Left 4 Cols: Tender Metadata & Executive Proposal Draft */}
              <div className="xl:col-span-4 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white">
                    Tender Brief & Executive Proposal
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-400 block">Topic / Programme</span>
                      <span className="font-semibold text-[#0D0F0E] dark:text-white">
                        {activeTender.title}
                      </span>
                    </div>
                    <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-400 block">Contracting Authority</span>
                      <span className="font-semibold text-[#0D0F0E] dark:text-white">
                        {activeTender.Authority}
                      </span>
                    </div>
                    <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-400 block">Lead Bid Architect</span>
                      <span className="font-semibold text-[#0D0F0E] dark:text-white">
                        {activeTender.ownerName} · {activeTender.ownerRole}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-[#168B7A] dark:text-[#DDFB82] block mb-1.5">
                      Proposal summary:
                    </span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {activeTender.executiveSummary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className="w-full min-h-[42px] rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-white hover:bg-[#DDFB82] dark:hover:bg-[#DDFB82] dark:hover:text-[#0D0F0E] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Open Side-by-Side Clause Diff →
                  </button>
                </div>
              </div>

              {/* Middle 4 Cols: "Up Next" Action Cards inspired directly by IMG_5846 & IMG_5847 */}
              <div className="xl:col-span-4 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white">
                      Up Next · Bid Sequence
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Automated Workflow
                    </span>
                  </div>

                  {/* Highlighted Lime Action Card matching "First Customer Call" in IMG_5846 */}
                  <div className="rounded-3xl bg-[#DDFB82] text-[#0D0F0E] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D0F0E]/70">
                          Step 1 · Priority Action
                        </span>
                        <h4 className="text-sm font-bold mt-0.5">
                          Remediate Mandatory Clause Discrepancies
                        </h4>
                      </div>
                      <WarningCircle size={20} weight="bold" />
                    </div>
                    <p className="text-xs text-[#0D0F0E]/85 leading-relaxed">
                      {activeTender.discrepancies.filter((d) => !d.resolved).length > 0
                        ? `${
                            activeTender.discrepancies.filter((d) => !d.resolved).length
                          } mandatory clauses require one-click Corporate Vault evidence injection prior to submission.`
                        : 'Review clause alignment and run a compliance audit before submission.'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setActiveTab('compliance')}
                        className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#0D0F0E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck size={14} weight="bold" />
                        <span>Resolve Now</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('comparison')}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-white/80 text-[#0D0F0E] text-xs font-semibold cursor-pointer"
                      >
                        Inspect Diff
                      </button>
                    </div>
                  </div>

                  {/* Step 2 Card */}
                  <div className="rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D0F0E] dark:text-white">
                        Step 2 · Vision OCR Addendum Check
                      </span>
                      <span className="font-mono text-[#168B7A]">Ready</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Scan late tender clarifications or scanned tables into structured clauses.
                    </p>
                    <button
                      onClick={() => setActiveTab('compliance')}
                      className="text-xs font-bold text-[#168B7A] dark:text-[#DDFB82] hover:underline pt-1 cursor-pointer"
                    >
                      Launch Vision OCR Scanner →
                    </button>
                  </div>

                  {/* Step 3 Card */}
                  <div className="rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D0F0E] dark:text-white">
                        Step 3 · Version Lock & Sign-Off
                      </span>
                      <span className="font-mono text-neutral-400">
                        {activeTender.versions[0]?.versionNumber}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Compare historical snapshots and export final compliant bid package.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Lead / Compliance Score Gauge Card (Direct match to IMG_5846) */}
              <div className="xl:col-span-4">
                <ComplianceScoreGauge
                  tender={activeTender}
                  onRunAudit={handleRunComplianceAudit}
                  isAuditing={isAuditing}
                />
              </div>
            </div>
          )}

          {activeTab === 'anatomy' && <BidAnatomyPanel key={activeTender.id} tender={activeTender} vaultDocs={vaultDocs} darkMode={darkMode} onReview={handleRecordReview} onEvidenceChange={handleEvidenceChange} onOpenComparison={openClauseComparison} onOpenVault={() => setActiveTab('compliance')} />}

          {activeTab === 'comparison' && (
            <DocumentComparisonTool
              key={activeTender.id}
              clauses={activeTender.clauses}
              initialClauseId={comparisonClauseId}
              vaultDocs={vaultDocs}
              onUpdateClause={handleUpdateClause}
              onDraftClauseWithAI={handleDraftClauseWithAI}
              draftingClauseId={draftingClauseId}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceVaultHub
              key={activeTender.id}
              clauseCount={activeTender.clauses.length}
              discrepancies={activeTender.discrepancies}
              vaultDocs={vaultDocs}
              onApplyComplianceFix={handleApplyComplianceFix}
              onRunAudit={handleRunComplianceAudit}
              isAuditing={isAuditing}
              onVectorSearch={handleVectorSearch}
              isSearchingVectors={isSearchingVectors}
              usedLiveEmbedding={usedLiveEmbedding}
              onOcrIngest={handleOcrIngest}
              isOcrRunning={isOcrRunning}
              lastOcrExtractedText={ocrExtractions[activeTender.id] ?? null}
            />
          )}

          {activeTab === 'versions' && (
            <VersionControlPanel
              key={activeTender.id}
              versions={activeTender.versions}
              currentClauses={activeTender.clauses}
              currentExecutiveSummary={activeTender.executiveSummary}
              onRestoreVersion={handleRestoreVersion}
              onCreateCheckpoint={handleCreateCheckpoint}
            />
          )}
          </motion.div></AnimatePresence>
        </section>
      </main>

      {/* Mobile & Tablet Touch-First Bottom Navigation Bar (<15% viewport height, >=44px hitboxes) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141716]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 grid grid-cols-5 gap-1"
      >
        <button
          onClick={() => setActiveTab('summary')}
          className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <House size={20} weight={activeTab === 'summary' ? 'fill' : 'regular'} />
          <span className="text-[10px] mt-0.5">Summary</span>
        </button>

        <button onClick={() => setActiveTab('anatomy')} className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center transition-colors ${activeTab === 'anatomy' ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
          <MagnifyingGlass size={20} weight={activeTab === 'anatomy' ? 'bold' : 'regular'} /><span className="text-[10px] mt-0.5">Anatomy</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'comparison'
              ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Columns size={20} weight={activeTab === 'comparison' ? 'fill' : 'regular'} />
          <span className="text-[10px] mt-0.5">50/50 Diff</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'compliance'
              ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Database size={20} weight={activeTab === 'compliance' ? 'fill' : 'regular'} />
          <span className="text-[10px] mt-0.5">Vault & OCR</span>
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'versions'
              ? 'bg-[#DDFB82] text-[#0D0F0E] font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <ClockCounterClockwise
            size={20}
            weight={activeTab === 'versions' ? 'fill' : 'regular'}
          />
          <span className="text-[10px] mt-0.5">Versions</span>
        </button>
      </nav>

      {/* Modal for Ingesting a New Tender RFP */}
      {showNewTenderModal && (
        <Dialog labelledBy="new-tender-title" onClose={() => setShowNewTenderModal(false)}>
            <h3 id="new-tender-title" className="text-lg font-bold text-[#0D0F0E] dark:text-white">
              Ingest New Government or Corporate Tender
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Initialize a new RFP workspace pre-linked to your Corporate Vector Vault and compliance engine.
            </p>
            <form onSubmit={handleCreateNewTender} className="mt-4 space-y-3">
              <div>
                <label htmlFor="tender-title" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Tender Title
                </label>
                <input
                  type="text"
                  required
                  id="tender-title"
                  autoFocus
                  value={newTenderTitle}
                  onChange={(e) => setNewTenderTitle(e.target.value)}
                  placeholder="e.g. Scottish Water Smart Telemetry & Edge AI Tender"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="tender-authority" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Issuing Authority / Client
                </label>
                <input
                  type="text"
                  id="tender-authority"
                  aria-label="Issuing authority"
                  value={newTenderAuthority}
                  onChange={(e) => setNewTenderAuthority(e.target.value)}
                  placeholder="e.g. Crown Commercial Service / Scottish Water"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="tender-budget" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Estimated Contract Value
                </label>
                <input
                  type="text"
                  id="tender-budget"
                  aria-label="Contract budget"
                  value={newTenderBudget}
                  onChange={(e) => setNewTenderBudget(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-[#0D0F0E] dark:text-white"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTenderModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-full bg-[#DDFB82] text-[#0D0F0E] text-xs font-bold cursor-pointer"
                >
                  Create workspace
                </button>
              </div>
            </form>
        </Dialog>
      )}
    </div></MotionConfig>
  );
}
