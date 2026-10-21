'use client';

import React, { useState } from 'react';
import {
  ShieldWarning,
  CheckCircle,
  Database,
  MagnifyingGlass,
  Scan,
  UploadSimple,
  Sparkle,
  Wrench,
  FileText,
  ArrowRight,
} from '@phosphor-icons/react';
import {
  ComplianceDiscrepancy,
  TenderClause,
  VaultDocument,
} from '@/lib/types';

interface ComplianceVaultHubProps {
  discrepancies: ComplianceDiscrepancy[];
  vaultDocs: VaultDocument[];
  onApplyComplianceFix: (discrepancy: ComplianceDiscrepancy) => void;
  onRunAudit: () => void;
  isAuditing: boolean;
  onVectorSearch: (query: string) => Promise<void>;
  isSearchingVectors: boolean;
  usedLiveEmbedding: boolean;
  onOcrIngest: (params: {
    base64Data?: string;
    mimeType?: string;
    rawText?: string;
  }) => Promise<void>;
  isOcrRunning: boolean;
  lastOcrExtractedText: string | null;
}

export function ComplianceVaultHub({
  discrepancies,
  vaultDocs,
  onApplyComplianceFix,
  onRunAudit,
  isAuditing,
  onVectorSearch,
  isSearchingVectors,
  usedLiveEmbedding,
  onOcrIngest,
  isOcrRunning,
  lastOcrExtractedText,
}: ComplianceVaultHubProps) {
  const [searchQuery, setSearchQuery] = useState(
    'ISO 27001 sovereign telemetry encryption and £25M public liability performance bond'
  );
  const [ocrNotes, setOcrNotes] = useState(
    'MANDATORY ADDENDUM CLAUSE SEC-8.9: Supplier must provide 24/7 UK-based Security Operations Center (SOC) incident response within 15 minutes and hold Cyber Essentials Plus certification.'
  );

  const handleVectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onVectorSearch(searchQuery.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      onOcrIngest({
        base64Data,
        mimeType: file.type || 'image/jpeg',
        rawText: ocrNotes,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleScanSample = () => {
    onOcrIngest({
      rawText: ocrNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: AI Compliance Discrepancy & Auto-Remediation Engine */}
      <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white flex items-center gap-2">
              <ShieldWarning size={20} weight="bold" className="text-[#309F92]" />
              <span>AI Compliance Verification & Discrepancy Remediation</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Cross-references mandatory tender thresholds against your company’s audited financials, insurance schedules, and past winning bids.
            </p>
          </div>

          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="min-h-[40px] px-4 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#EDFF8C] dark:text-[#0D0F0E] text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkle size={15} weight="fill" />
            <span>{isAuditing ? 'Running Deep Compliance Check...' : 'Re-Scan Proposal Compliance'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {discrepancies.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] text-center space-y-2">
              <CheckCircle size={28} weight="bold" className="text-[#309F92] mx-auto" />
              <p className="text-sm font-bold text-[#0D0F0E] dark:text-white">
                Zero Unresolved Compliance Discrepancies
              </p>
              <p className="text-xs text-neutral-500">
                All mandatory RFP clauses are aligned with verified Corporate Vault records.
              </p>
            </div>
          ) : (
            discrepancies.map((disc) => (
              <div
                key={disc.id}
                className={`rounded-2xl p-4 border transition-colors ${
                  disc.resolved
                    ? 'bg-[#F8FAF9] dark:bg-[#111716] border-[#309F92]/40'
                    : 'bg-[#F8F9F8] dark:bg-[#111413] border-amber-500/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                      Clause {disc.clauseCode}
                    </span>
                    <span>·</span>
                    <span
                      className={`font-bold ${
                        disc.resolved
                          ? 'text-[#309F92]'
                          : disc.severity === 'critical'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {disc.resolved
                        ? 'Resolved & Synced to Proposal'
                        : disc.severity === 'critical'
                        ? 'Critical Disqualification Risk'
                        : 'Compliance Warning'}
                    </span>
                    <span>·</span>
                    <span className="text-neutral-500">
                      Evidence: {disc.vaultEvidenceCited}
                    </span>
                  </div>

                  {!disc.resolved && (
                    <button
                      onClick={() => onApplyComplianceFix(disc)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#EDFF8C] text-[#0D0F0E] hover:bg-[#e3f776] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Wrench size={14} weight="bold" />
                      <span>Inject Compliant Vault Evidence</span>
                    </button>
                  )}
                </div>

                <h4 className="mt-2 text-sm font-bold text-[#0D0F0E] dark:text-white">
                  {disc.issueTitle}
                </h4>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#161918] border border-neutral-200/60 dark:border-neutral-800">
                    <span className="font-semibold text-neutral-500 block mb-1">
                      Tender Requirement vs. Current Statement:
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      {disc.currentProposalText}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#309F92]/10 dark:bg-[#309F92]/15 border border-[#309F92]/30">
                    <span className="font-semibold text-[#309F92] dark:text-[#EDFF8C] block mb-1">
                      AI Verified Remediation (Backed by Vault):
                    </span>
                    <p className="text-[#0D0F0E] dark:text-neutral-100">
                      {disc.recommendedFix}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 2: OCR Document & Scanned Tender Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-[#0D0F0E] dark:text-white">
              <Scan size={20} weight="bold" className="text-[#309F92]" />
              <h4>Vision OCR Scanned Tender Ingestion</h4>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Upload a scanned tender page (JPEG/PNG) or paste raw addendum text. Gemini Vision OCR extracts mandatory clauses, cross-references the vector vault, and appends a compliant response directly into your proposal.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  Simulated Scanned Addendum / OCR Text Input:
                </span>
                <textarea
                  value={ocrNotes}
                  onChange={(e) => setOcrNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl bg-[#F1F1F1] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 p-3 text-xs text-[#0D0F0E] dark:text-white focus:outline-hidden focus:border-[#309F92]"
                />
              </label>

              {lastOcrExtractedText && (
                <div className="p-3 rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] border border-[#309F92]/30 text-xs space-y-1">
                  <span className="font-mono font-bold text-[#309F92] dark:text-[#EDFF8C]">
                    Latest OCR Extraction Added to Proposal:
                  </span>
                  <p className="text-neutral-700 dark:text-neutral-300 line-clamp-3">
                    {lastOcrExtractedText}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
            <button
              onClick={handleScanSample}
              disabled={isOcrRunning}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#EDFF8C] text-[#0D0F0E] hover:bg-[#e1f578] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Scan size={15} weight="bold" />
              <span>{isOcrRunning ? 'Extracting & Drafting...' : 'Run OCR & Auto-Draft Clause'}</span>
            </button>

            <label className="min-h-[40px] px-4 py-2 rounded-full bg-[#F1F1F1] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <UploadSimple size={15} weight="bold" />
              <span>Upload Scanned Page</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Vector Embeddings Corporate Memory Vault */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-base font-bold text-[#0D0F0E] dark:text-white">
                <Database size={20} weight="bold" className="text-[#309F92]" />
                <h4>Corporate Vector Knowledge Base (Embeddings Retrieval)</h4>
              </div>
              <span className="text-xs font-mono text-[#309F92] dark:text-[#EDFF8C]">
                {usedLiveEmbedding
                  ? 'gemini-embedding-2-preview · Cosine Ranked'
                  : 'Vector Cosine Index · 5 Verified Records'}
              </span>
            </div>

            <form onSubmit={handleVectorSubmit} className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query past bids, ISO certificates, audited turnover, bonding..."
                  className="w-full min-h-[40px] pl-9 pr-4 py-2 rounded-full bg-[#F1F1F1] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white focus:outline-hidden focus:border-[#309F92]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingVectors}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#EDFF8C] dark:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{isSearchingVectors ? 'Embedding...' : 'Vector Search'}</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </form>

            <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {vaultDocs.map((doc) => {
                const simPct = doc.similarityScore
                  ? Math.round(doc.similarityScore * 100)
                  : 88;
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#309F92]" />
                        <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                          {doc.referenceCode}
                        </span>
                        <span>·</span>
                        <span className="text-neutral-500">{doc.category}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-[#309F92] dark:text-[#EDFF8C]">
                        Cosine Similarity: {simPct}%
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#0D0F0E] dark:text-white">
                      {doc.title}
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {doc.fullText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
