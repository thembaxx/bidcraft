'use client';

import React, { useState } from 'react';
import {
  ClockCounterClockwise,
  GitDiff,
  ArrowCounterClockwise,
  CheckCircle,
  Sparkle,
  UserCircle,
  Scan,
} from '@phosphor-icons/react';
import { ProposalVersion, TenderClause } from '@/lib/types';

interface VersionControlPanelProps {
  versions: ProposalVersion[];
  currentClauses: TenderClause[];
  currentExecutiveSummary: string;
  onRestoreVersion: (version: ProposalVersion) => void;
  onCreateCheckpoint: (label: string) => void;
}

export function VersionControlPanel({
  versions,
  currentClauses,
  currentExecutiveSummary,
  onRestoreVersion,
  onCreateCheckpoint,
}: VersionControlPanelProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || ''
  );
  const [compareTargetId, setCompareTargetId] = useState<string>(
    versions[1]?.id || versions[0]?.id || ''
  );
  const [checkpointNote, setCheckpointNote] = useState('');

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) || versions[0];
  const compareTarget =
    versions.find((v) => v.id === compareTargetId) || versions[1] || versions[0];

  const handleCreateManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointNote.trim()) return;
    onCreateCheckpoint(checkpointNote.trim());
    setCheckpointNote('');
  };

  return (
    <div className="space-y-4">
      {/* Top Version Control Action Header */}
      <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white flex items-center gap-2">
            <ClockCounterClockwise size={20} weight="bold" className="text-[#309F92]" />
            <span>Proposal Version Control & Immutable Audit Trail</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Track automated AI drafts, OCR clause syncs, and manual legal edits. Compare any two versions or restore a prior state with one click.
          </p>
        </div>

        <form onSubmit={handleCreateManualSnapshot} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={checkpointNote}
            onChange={(e) => setCheckpointNote(e.target.value)}
            placeholder="Tag a new snapshot (e.g. Pre-Legal Signoff)..."
            className="min-h-[40px] px-4 py-2 rounded-full bg-[#F1F1F1] dark:bg-[#0D0F0E] border border-neutral-200 dark:border-neutral-800 text-xs text-[#0D0F0E] dark:text-white w-full sm:w-64 focus:outline-hidden focus:border-[#309F92]"
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#EDFF8C] dark:text-[#0D0F0E] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Save Snapshot
          </button>
        </form>
      </div>

      {/* Main Split: Version History Timeline (Left) + Version Comparison & Restore Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 5 Cols: Version Timeline List */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
            <span className="font-semibold text-[#0D0F0E] dark:text-white">
              Revision History ({versions.length} Snapshots)
            </span>
            <span>Click to inspect</span>
          </div>

          {versions.map((ver, idx) => {
            const isSelected = selectedVersion?.id === ver.id;
            const isLatest = idx === 0;

            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersionId(ver.id)}
                className={`rounded-2xl p-4 transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#EDFF8C]/35 dark:bg-[#EDFF8C]/15 border-[#309F92] dark:border-[#EDFF8C]'
                    : 'bg-[#F8F9F8] dark:bg-[#111413] border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-sm text-[#0D0F0E] dark:text-white">
                      {ver.versionNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#309F92] dark:text-[#EDFF8C]">
                      {ver.triggerType}
                    </span>
                    {isLatest && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-[#0D0F0E] dark:text-white">
                          HEAD
                        </span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#0D0F0E] dark:text-white">
                    Score {ver.complianceScoreSnapshot}%
                  </span>
                </div>

                <p className="mt-1.5 text-xs font-medium text-[#0D0F0E] dark:text-neutral-200 leading-relaxed">
                  {ver.summary}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    {ver.triggerType === 'Manual Edit' ? (
                      <UserCircle size={13} />
                    ) : ver.triggerType === 'OCR Clause Sync' ? (
                      <Scan size={13} />
                    ) : (
                      <Sparkle size={13} />
                    )}
                    <span>{ver.author}</span>
                  </span>
                  <span className="font-mono tabular-nums">{ver.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Version Diff & One-Click Restore */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4">
          {selectedVersion ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono font-bold text-[#0D0F0E] dark:text-white">
                      Inspecting {selectedVersion.versionNumber}
                    </span>
                    <span>·</span>
                    <span>{selectedVersion.timestamp}</span>
                    <span>·</span>
                    <span>Author: {selectedVersion.author}</span>
                  </div>
                  <h4 className="text-base font-bold text-[#0D0F0E] dark:text-white mt-1">
                    {selectedVersion.summary}
                  </h4>
                </div>

                <button
                  onClick={() => onRestoreVersion(selectedVersion)}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-[#EDFF8C] text-[#0D0F0E] hover:bg-[#e2f678] text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Restore {selectedVersion.versionNumber} as Active Draft</span>
                </button>
              </div>

              {/* Compare Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#F1F1F1] dark:bg-[#0D0F0E] text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#0D0F0E] dark:text-white">
                  <GitDiff size={16} className="text-[#309F92]" />
                  <span>Comparing {selectedVersion.versionNumber} against:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setCompareTargetId(v.id)}
                      className={`px-3 py-1 rounded-full font-mono text-xs transition-colors cursor-pointer ${
                        compareTarget?.id === v.id
                          ? 'bg-[#309F92] text-white font-bold'
                          : 'bg-white dark:bg-[#161918] text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {v.versionNumber} ({v.complianceScoreSnapshot}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Executive Summary Snapshot Comparison */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  Executive Summary Snapshot Diff ({selectedVersion.versionNumber} vs.{' '}
                  {compareTarget?.versionNumber || 'Current'})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAF9] dark:bg-[#111716] border border-[#309F92]/30 text-xs leading-relaxed">
                    <div className="font-mono font-bold text-[#309F92] dark:text-[#EDFF8C] mb-1">
                      {selectedVersion.versionNumber} ({selectedVersion.triggerType})
                    </div>
                    <p className="text-[#0D0F0E] dark:text-neutral-200">
                      {selectedVersion.executiveSummarySnapshot || currentExecutiveSummary}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200 dark:border-neutral-800 text-xs leading-relaxed">
                    <div className="font-mono font-bold text-neutral-500 mb-1">
                      {compareTarget?.versionNumber} ({compareTarget?.triggerType})
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {compareTarget?.executiveSummarySnapshot || currentExecutiveSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clause-Level Revision Breakdown */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  Clause Snapshot Comparison
                </h5>
                {(selectedVersion.clausesSnapshot.length > 0
                  ? selectedVersion.clausesSnapshot
                  : currentClauses
                ).map((clause) => {
                  const comparedClause = compareTarget?.clausesSnapshot.find(
                    (c) => c.code === clause.code
                  );
                  const changed =
                    comparedClause &&
                    comparedClause.proposalResponseText !== clause.proposalResponseText;

                  return (
                    <div
                      key={clause.id}
                      className="p-3.5 rounded-2xl bg-[#F8F9F8] dark:bg-[#111413] border border-neutral-200/70 dark:border-neutral-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0D0F0E] dark:text-white">
                          <span className="font-mono mr-1.5">{clause.code}</span>
                          {clause.title}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            changed ? 'text-[#309F92] dark:text-[#EDFF8C]' : 'text-neutral-400'
                          }`}
                        >
                          {changed ? 'Modified in this version' : 'Unchanged'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {clause.proposalResponseText}
                      </p>
                      {changed && comparedClause && (
                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
                          <span className="font-mono font-semibold mr-1.5">
                            Prior ({compareTarget?.versionNumber}):
                          </span>
                          <span className="line-through">
                            {comparedClause.proposalResponseText}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-neutral-500">
              Select a version snapshot from the left timeline to inspect or restore.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
