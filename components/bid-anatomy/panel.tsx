'use client';

import { useState } from 'react';
import { INSPECTION_LABELS, inspectionSummary } from '@/lib/bid-anatomy';
import type { ClauseReview, TenderProject, VaultDocument } from '@/lib/types';
import { InspectionBench } from './inspection-bench';
import { ClauseInspector } from './clause-inspector';
import './anatomy.css';

interface BidAnatomyPanelProps {
  tender: TenderProject;
  vaultDocs: VaultDocument[];
  darkMode: boolean;
  onReview: (clauseId: string, outcome: ClauseReview['outcome'], note: string) => boolean;
  onEvidenceChange: (clauseId: string, ids: string[]) => void;
  onOpenComparison: (clauseId: string) => void;
  onOpenVault: () => void;
}

export default function BidAnatomyPanel({ tender, vaultDocs, darkMode, onReview, onEvidenceChange, onOpenComparison, onOpenVault }: BidAnatomyPanelProps) {
  const summary = inspectionSummary(tender, vaultDocs);
  const [selectedId, setSelectedId] = useState(() => summary.states.find(({ state }) => state === 'blocked')?.clause.id ?? tender.clauses[0]?.id ?? '');
  const selectedIndex = Math.max(0, tender.clauses.findIndex((clause) => clause.id === selectedId));
  const selected = tender.clauses[selectedIndex];
  const page = Math.floor(selectedIndex / 6);
  const stations = summary.states.slice(page * 6, page * 6 + 6);
  const findNextReview = () => {
    for (let step = 1; step <= summary.total; step++) {
      const candidate = summary.states[(selectedIndex + step) % summary.total];
      if (candidate.state !== 'approved') { setSelectedId(candidate.clause.id); return; }
    }
  };

  return <section className="bid-anatomy-shell" aria-labelledby="bid-anatomy-title">
    <header className="anatomy-header"><div><p className="anatomy-eyebrow">Your proposal, under the lens</p><h3 id="bid-anatomy-title">Bid Anatomy</h3><p>Inspect the requirement. Read the evidence. Record the human review.</p></div><button type="button" className="anatomy-secondary" onClick={findNextReview} disabled={!summary.awaitingReview}>Inspect next unreviewed clause →</button></header>
    {summary.total === 0 ? <div className="anatomy-empty" role="status"><h4>The inspection bench is ready for your requirements.</h4><p>Import tender clauses to connect your proposal, evidence, and review decisions.</p><button type="button" className="anatomy-primary" onClick={onOpenVault}>Import tender requirements →</button></div> : <>
      <dl className="anatomy-stats" aria-label="Bid inspection summary">
        <div><dt>Requirements</dt><dd>{summary.total}</dd></div><div><dt>Mandatory reviewed</dt><dd>{summary.reviewedMandatory}<span> / {summary.mandatory}</span></dd></div><div><dt>Awaiting approval</dt><dd>{summary.awaitingReview}</dd></div><div><dt>Unresolved flags</dt><dd>{summary.openFlags}</dd></div>
      </dl>
      <InspectionBench stations={stations} selectedId={selected?.id ?? ''} onSelect={setSelectedId} progress={summary.mandatoryProgress} theme={darkMode ? 'dark' : 'light'} />
      <div className="anatomy-pagination"><p>{summary.mandatory > 0 && summary.reviewedMandatory === summary.mandatory ? 'All mandatory clauses have a recorded human review.' : 'AI alignment alone leaves a pin awaiting review.'}</p>{summary.total > 6 && <div><button type="button" aria-label="Previous inspection stations" disabled={page === 0} onClick={() => setSelectedId(tender.clauses[(page - 1) * 6].id)}>←</button><span>Stations {page * 6 + 1}–{Math.min(page * 6 + 6, summary.total)} of {summary.total}</span><button type="button" aria-label="Next inspection stations" disabled={(page + 1) * 6 >= summary.total} onClick={() => setSelectedId(tender.clauses[(page + 1) * 6].id)}>→</button></div>}</div>
      <div className="anatomy-clause-list" role="group" aria-label="Requirements on this bench">{stations.map(({ clause, state }) => <button type="button" key={clause.id} aria-pressed={selected?.id === clause.id} onClick={() => setSelectedId(clause.id)} data-status={state}><span className="anatomy-clause-code">{clause.code}</span><span className="anatomy-clause-name">{clause.title}</span><span className="anatomy-clause-status">{INSPECTION_LABELS[state]}</span></button>)}</div>
      {selected && <ClauseInspector clause={selected} vaultDocs={vaultDocs} flags={tender.discrepancies} onReview={(outcome, note) => onReview(selected.id, outcome, note)} onEvidenceChange={(ids) => onEvidenceChange(selected.id, ids)} onOpenComparison={() => onOpenComparison(selected.id)} onOpenVault={onOpenVault} />}
    </>}
  </section>;
}
