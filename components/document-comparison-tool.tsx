'use client';

import React, { useState, useMemo } from 'react';
import {
  Columns,
  Stack,
  Lightning,
  Check,
  PencilSimple,
  BookOpen,
  Sparkle,
  Eye,
  CaretRight,
} from '@phosphor-icons/react';
import { TenderClause, VaultDocument } from '@/lib/types';

interface DocumentComparisonToolProps {
  clauses: TenderClause[];
  vaultDocs: VaultDocument[];
  onUpdateClause: (clauseId: string, newText: string, summaryNote: string, triggerType: 'Manual Edit' | 'AI Auto-Draft') => void;
  onDraftClauseWithAI: (clause: TenderClause, mode: string) => Promise<void>;
  draftingClauseId: string | null;
}

// Compute token-level differences between Original RFP Requirement and Drafted Proposal Response
function computeWordDiff(original: string, proposal: string) {
  const origWords = new Set(
    original
      .toLowerCase()
      .replace(/[^a-z0-9%.£$]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  const tokens = proposal.split(/(\s+)/);
  return tokens.map((token, idx) => {
    const clean = token.toLowerCase().replace(/[^a-z0-9%.£$]/g, '');
    const isMatchedKeyword = clean.length > 3 && origWords.has(clean);
    const isNumericOrCode = /\d/.test(token) || /^[A-Z]{2,}-\d/.test(token);
    return {
      token,
      key: idx,
      isMatchedKeyword,
      isNumericOrCode,
    };
  });
}

export function DocumentComparisonTool({
  clauses,
  vaultDocs,
  onUpdateClause,
  onDraftClauseWithAI,
  draftingClauseId,
}: DocumentComparisonToolProps) {
  const [viewFormat, setViewFormat] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [highlightMode, setHighlightMode] = useState<'all' | 'non-compliant' | 'metrics'>('all');
  const [selectedClauseId, setSelectedClauseId] = useState<string>(clauses[0]?.id || '');
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editDraftText, setEditDraftText] = useState<string>('');

  const filteredClauses = useMemo(() => {
    if (highlightMode === 'non-compliant') {
      return clauses.filter((c) => c.complianceStatus !== 'compliant');
    }
    return clauses;
  }, [clauses, highlightMode]);

  const activeClause = useMemo(
    () => filteredClauses.find((c) => c.id === selectedClauseId) || filteredClauses[0],
    [filteredClauses, selectedClauseId]
  );

  const startManualEdit = (clause: TenderClause) => {
    setEditingClauseId(clause.id);
    setEditDraftText(clause.proposalResponseText);
  };

  const saveManualEdit = (clause: TenderClause) => {
    if (editDraftText.trim() && editDraftText !== clause.proposalResponseText) {
      onUpdateClause(
        clause.id,
        editDraftText.trim(),
        `Manual refinement of ${clause.code} (${clause.title})`,
        'Manual Edit'
      );
    }
    setEditingClauseId(null);
  };

  return (
    <div className="space-y-4">
      {/* Comparison Toolbar inspired by IMG_5849_27a3bd3f.jpeg */}
      <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white">
            Interactive Tender vs. Proposal Comparison Studio
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Inspect original mandatory RFP clauses against AI-generated proposal responses with live semantic & numeric diff highlighting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Segmented Switch */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E]">
            <button
              onClick={() => setViewFormat('side-by-side')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewFormat === 'side-by-side'
                  ? 'bg-white dark:bg-[#1E2221] text-[#0D0F0E] dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-[#0D0F0E] dark:hover:text-white'
              }`}
            >
              <Columns size={15} weight="bold" className="text-[#168B7A]" />
              <span>50/50 Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewFormat('overlay')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewFormat === 'overlay'
                  ? 'bg-white dark:bg-[#1E2221] text-[#0D0F0E] dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-[#0D0F0E] dark:hover:text-white'
              }`}
            >
              <Stack size={15} weight="bold" className="text-[#168B7A]" />
              <span>Unified Overlay Diff</span>
            </button>
          </div>

          {/* Filter / Highlight Mode */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E]">
            <button
              onClick={() => setHighlightMode('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                highlightMode === 'all'
                  ? 'bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E]'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              All Clauses ({clauses.length})
            </button>
            <button
              onClick={() => setHighlightMode('non-compliant')}
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                highlightMode === 'non-compliant'
                  ? 'bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E]'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Needs Review ({clauses.filter((c) => c.complianceStatus !== 'compliant').length})
            </button>
            <button
              onClick={() =>
                setHighlightMode(highlightMode === 'metrics' ? 'all' : 'metrics')
              }
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                highlightMode === 'metrics'
                  ? 'bg-[#DDFB82] text-[#0D0F0E]'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Highlight SLAs & Numbers
            </button>
          </div>
        </div>
      </div>

      {/* Clause Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filteredClauses.map((clause) => {
          const isSelected = activeClause?.id === clause.id;
          return (
            <button
              key={clause.id}
              onClick={() => { setSelectedClauseId(clause.id); document.getElementById(`clause-card-${clause.id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); }}
              className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] border-transparent'
                  : 'bg-white dark:bg-[#161918] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-[#168B7A]'
              }`}
            >
              <span className="font-mono font-bold">{clause.code}</span>
              <span>·</span>
              <span className="truncate max-w-[180px]">{clause.title}</span>
              <span
                className={`ml-1 text-[11px] font-mono tabular-nums ${
                  clause.complianceStatus === 'compliant'
                    ? isSelected
                      ? 'text-[#DDFB82] dark:text-[#0D0F0E]'
                      : 'text-[#168B7A]'
                    : 'text-amber-500'
                }`}
              >
                {clause.confidenceScore}%
              </span>
            </button>
          );
        })}
      </div>

      {filteredClauses.length === 0 && <p role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 dark:bg-[#161918]">{clauses.length ? 'No clauses need review in this view.' : 'Import tender requirements from Compliance & vault to start comparing.'}</p>}
      {/* Comparison Matrix Content */}
      <div className="space-y-4">
        {filteredClauses.map((clause) => {
          const diffTokens = computeWordDiff(clause.originalText, clause.proposalResponseText);
          const matchedDocs = vaultDocs.filter((v) => clause.matchedVaultDocIds.includes(v.id));
          const isEditing = editingClauseId === clause.id;
          const isDrafting = draftingClauseId === clause.id;

          return (
            <div
              key={clause.id}
              id={`clause-card-${clause.id}`}
              className={`rounded-3xl bg-white dark:bg-[#161918] border transition-colors p-5 ${
                activeClause?.id === clause.id
                  ? 'border-[#168B7A] dark:border-[#DDFB82]/70'
                  : 'border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              {/* Clause Header Metadata (Zero-Pill Unboxed Text Discipline) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                    {clause.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{clause.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{clause.mandatory ? 'Mandatory Requirement' : 'Evaluated Criteria'}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      clause.complianceStatus === 'compliant'
                        ? 'text-[#168B7A]'
                        : clause.complianceStatus === 'partial'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {clause.complianceStatus === 'compliant'
                      ? 'Verified Compliant'
                      : clause.complianceStatus === 'partial'
                      ? 'Partial Alignment (Needs Review)'
                      : 'Discrepancy Flagged'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Confidence {clause.confidenceScore}%
                  </span>
                </div>

                {/* Action Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onDraftClauseWithAI(clause, 'strict-compliance')}
                    disabled={Boolean(draftingClauseId)}
                    className="min-h-[36px] px-3 py-1.5 rounded-full bg-[#DDFB82] text-[#0D0F0E] hover:bg-[#e1f578] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Lightning size={14} weight="fill" />
                    <span>{isDrafting ? 'Synthesizing...' : 'AI Auto-Align Clause'}</span>
                  </button>
                  {!isEditing ? (
                    <button
                      onClick={() => startManualEdit(clause)}
                      className="min-h-[36px] px-3 py-1.5 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <PencilSimple size={14} />
                      <span>Manual Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => saveManualEdit(clause)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#168B7A] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Check size={14} weight="bold" />
                      <span>Commit Version</span>
                    </button>
                  )}
                </div>
              </div>

              <h4 className="mt-3 text-base font-bold text-[#0D0F0E] dark:text-white">
                {clause.title}
              </h4>

              {/* Side-by-Side or Overlay Diff Layout */}
              {viewFormat === 'side-by-side' ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                  {/* Left Column: Original RFP Document Clause */}
                  <div className="rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        <span className="font-semibold text-[#0D0F0E] dark:text-neutral-200">
                          Original Tender Requirement (Source RFP)
                        </span>
                        <span className="font-mono">Clause {clause.code}</span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {clause.originalText}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <BookOpen size={14} className="text-[#168B7A]" />
                      <span>Cross-Referenced Vault Evidence:</span>
                      {matchedDocs.map((doc) => (
                        <span
                          key={doc.id}
                          className="font-mono font-semibold text-[#0D0F0E] dark:text-[#DDFB82]"
                        >
                          [{doc.referenceCode}]
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Drafted Proposal Response with Diff Highlighting */}
                  <div className="rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] border border-[#168B7A]/30 dark:border-[#168B7A]/40 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        <span className="font-semibold text-[#168B7A] dark:text-[#DDFB82]">
                          {clause.proposalSectionTitle} (AI Proposal Response)
                        </span>
                        <span className="font-mono">Live Diff Active</span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            aria-label={`Edit response for ${clause.code}`}
                            value={editDraftText}
                            onChange={(e) => setEditDraftText(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl bg-white dark:bg-[#0D0F0E] border border-[#168B7A] p-3 text-sm text-[#0D0F0E] dark:text-white focus:outline-hidden"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingClauseId(null)}
                              className="px-3 py-1.5 rounded-full text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveManualEdit(clause)}
                              className="px-4 py-1.5 rounded-full bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] text-xs font-semibold"
                            >
                              Save & Create Version Snapshot
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#0D0F0E] dark:text-neutral-100 leading-relaxed">
                          {diffTokens.map((item) => {
                            if (highlightMode === 'metrics' && item.isNumericOrCode) {
                              return (
                                <mark
                                  key={item.key}
                                  className="bg-[#DDFB82] text-[#0D0F0E] px-1 rounded-xs font-mono font-semibold"
                                >
                                  {item.token}
                                </mark>
                              );
                            }
                            if (item.isMatchedKeyword) {
                              return (
                                <span
                                  key={item.key}
                                  className="underline decoration-[#168B7A] decoration-2 underline-offset-4 font-medium"
                                >
                                  {item.token}
                                </span>
                              );
                            }
                            return <span key={item.key}>{item.token}</span>;
                          })}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#168B7A]/20 flex items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                        <Sparkle size={14} weight="fill" className="text-[#168B7A]" />
                        <span>{clause.aiNote}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Unified Overlay Format */
                <div className="mt-4 rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Eye size={14} className="text-[#168B7A]" />
                    <span>Unified Clause Overlay — Source Requirement (Top) vs. Proposal Commitment (Bottom)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-xs text-neutral-700 dark:text-neutral-200 font-mono leading-relaxed">
                    <span className="font-bold text-rose-600 dark:text-rose-400 mr-2">
                      [RFP REQUIREMENT]
                    </span>
                    {clause.originalText}
                  </div>
                  <div className="flex items-center justify-center text-neutral-400">
                    <CaretRight size={16} className="rotate-90" />
                  </div>
                  <div className="p-3 rounded-xl bg-[#168B7A]/15 dark:bg-[#DDFB82]/15 text-xs text-[#0D0F0E] dark:text-white font-mono leading-relaxed">
                    <span className="font-bold text-[#168B7A] dark:text-[#DDFB82] mr-2">
                      [PROPOSAL COMMIT]
                    </span>
                    {isEditing ? <textarea aria-label={`Edit response for ${clause.code}`} value={editDraftText} onChange={(event) => setEditDraftText(event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-[#168B7A] bg-white p-3 text-sm text-[#0D0F0E] dark:bg-[#0D0F0E] dark:text-white" /> : clause.proposalResponseText}
                    {isEditing && <button type="button" onClick={() => setEditingClauseId(null)} className="mt-2 block text-xs underline">Cancel edit</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
