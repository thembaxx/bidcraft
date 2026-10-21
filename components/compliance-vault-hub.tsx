'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldWarning,
  CheckCircle,
  Database,
  MagnifyingGlass,
  Scan,
  UploadSimple,
  WarningCircle,
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
import { SouthAfricanBidGuide } from '@/components/south-african-bid-guide';

interface ComplianceVaultHubProps {
  clauseCount: number;
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
  clauseCount,
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
    'ISO 27001 POPIA and R25 million public liability performance guarantee'
  );
  const [ocrNotes, setOcrNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleVectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onVectorSearch(searchQuery.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    if (isOcrRunning) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setUploadError('Choose a JPEG, PNG, WebP, or PDF file up to 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      onOcrIngest({
        base64Data,
        mimeType: file.type,
      });
    };
    reader.onerror = () => setUploadError('The file could not be read. Please choose it again.');
    reader.readAsDataURL(file);
  };

  const handleScanSample = () => {
    onOcrIngest({
      rawText: ocrNotes,
    });
  };

  return (
    <div className="space-y-6">
      <SouthAfricanBidGuide />
      <div role="note" className="flex items-start gap-2 rounded-2xl border border-amber-400/35 bg-amber-50 p-4 text-xs leading-6 text-amber-950 dark:bg-[#2D2518] dark:text-amber-100"><WarningCircle size={18} className="mt-1 shrink-0" aria-hidden="true" /><p><strong>Before using AI:</strong> Selected clauses, evidence and uploaded pages may be sent to Google Gemini. Unpaid-tier terms can permit data use and human review. Avoid personal or confidential documents unless your organisation has verified the processing arrangements. Results are suggestions, not certified compliance. <Link href="/ai-disclosure" className="font-bold underline underline-offset-2">AI & data details</Link></p></div>
      {/* Section 1: AI Compliance Discrepancy & Auto-Remediation Engine */}
      <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white flex items-center gap-2">
              <ShieldWarning size={20} weight="bold" className="text-[#168B7A]" />
              <span>AI review & suggested improvements</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              AI compares your supplied clauses against available evidence; it cannot authenticate financials, registrations, certifications or eligibility.
            </p>
          </div>

          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="min-h-[40px] px-4 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkle size={15} weight="fill" />
            <span>{isAuditing ? 'Running Deep Compliance Check...' : 'Re-Scan Proposal Compliance'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {discrepancies.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] text-center space-y-2">
              <CheckCircle size={28} weight="bold" className="text-[#168B7A] mx-auto" />
              <p className="text-sm font-bold text-[#0D0F0E] dark:text-white">
                No recorded compliance flags
              </p>
              <p className="text-xs text-neutral-500">
                {clauseCount ? 'No issues are recorded. Run an audit after changing your proposal.' : 'Import tender clauses to start reviewing compliance.'}
              </p>
            </div>
          ) : (
            discrepancies.map((disc) => (
              <div
                key={disc.id}
                className={`rounded-2xl p-4 border transition-colors ${
                  disc.resolved
                    ? 'bg-[#F8FAF9] dark:bg-[#111716] border-[#168B7A]/40'
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
                          ? 'text-[#168B7A]'
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

                  {!disc.resolved && disc.severity !== 'verified' && disc.recommendedFix.trim() && (
                    <button
                      onClick={() => onApplyComplianceFix(disc)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#DDFB82] text-[#0D0F0E] hover:bg-[#e3f776] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Wrench size={14} weight="bold" />
                      <span>Apply suggested wording</span>
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
                  <div className="p-3 rounded-xl bg-[#168B7A]/10 dark:bg-[#168B7A]/15 border border-[#168B7A]/30">
                    <span className="font-semibold text-[#168B7A] dark:text-[#DDFB82] block mb-1">
                      AI-suggested wording (review required):
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
              <Scan size={20} weight="bold" className="text-[#168B7A]" />
              <h4>Vision OCR Scanned Tender Ingestion</h4>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Upload a JPEG, PNG, WebP, or PDF up to 5 MB, or paste tender text. Extract requirements and draft responses against the evidence library, then review the results.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  Tender requirements / addendum text:
                </span>
                <textarea
                  value={ocrNotes}
                  placeholder="Paste the actual tender requirements or addendum text…"
                  onChange={(e) => setOcrNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 p-3 text-xs text-[#0D0F0E] dark:text-white focus:outline-hidden focus:border-[#168B7A]"
                />
              </label>

              {lastOcrExtractedText && (
                <div className="p-3 rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] border border-[#168B7A]/30 text-xs space-y-1">
                  <span className="font-mono font-bold text-[#168B7A] dark:text-[#DDFB82]">
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
              disabled={isOcrRunning || !ocrNotes.trim()}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#DDFB82] text-[#0D0F0E] hover:bg-[#e1f578] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Scan size={15} weight="bold" />
              <span>{isOcrRunning ? 'Extracting & Drafting...' : 'Run OCR & Auto-Draft Clause'}</span>
            </button>

            <label className="min-h-[40px] px-4 py-2 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <UploadSimple size={15} weight="bold" />
              <span>Upload Scanned Page</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={isOcrRunning}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadError && <p role="alert" className="w-full text-xs text-rose-600">{uploadError}</p>}
          </div>
        </div>

        {/* Section 3: Vector Embeddings Corporate Memory Vault */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-base font-bold text-[#0D0F0E] dark:text-white">
                <Database size={20} weight="bold" className="text-[#168B7A]" />
                <h4>Corporate Vector Knowledge Base (Embeddings Retrieval)</h4>
              </div>
              <span className="text-xs font-mono text-[#168B7A] dark:text-[#DDFB82]">
                {usedLiveEmbedding
                  ? 'Live embedding similarity'
                  : `Local text similarity · ${vaultDocs.length} records`}
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
                  className="w-full min-h-[40px] pl-9 pr-4 py-2 rounded-full bg-[#F8F6EF] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white focus:outline-hidden focus:border-[#168B7A]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingVectors}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{isSearchingVectors ? 'Embedding...' : 'Vector Search'}</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </form>

            <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {vaultDocs.map((doc) => {
                const simPct = doc.similarityScore === undefined ? null : Math.round(doc.similarityScore * 100);
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#168B7A]" />
                        <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                          {doc.referenceCode}
                        </span>
                        <span>·</span>
                        <span className="text-neutral-500">{doc.category}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-[#168B7A] dark:text-[#DDFB82]">
                        {simPct === null ? 'Not searched' : `Similarity: ${simPct}%`}
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
