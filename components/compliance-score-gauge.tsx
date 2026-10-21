'use client';

import React from 'react';
import { ArrowUpRight, DotsThree, ShieldCheck, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { TenderProject } from '@/lib/types';

interface ComplianceScoreGaugeProps {
  tender: TenderProject;
  onRunAudit: () => void;
  isAuditing: boolean;
}

export function ComplianceScoreGauge({
  tender,
  onRunAudit,
  isAuditing,
}: ComplianceScoreGaugeProps) {
  const totalTicks = 48;
  const activeTicks = Math.round((tender.leadScore / 100) * totalTicks);

  const compliantCount = tender.clauses.filter((c) => c.complianceStatus === 'compliant').length;
  const openDiscrepancies = tender.discrepancies.filter((d) => !d.resolved).length;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0D0F0E] dark:text-white tracking-tight">
            Bid Compliance Score
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRunAudit}
              disabled={isAuditing}
              title="Run AI Compliance Audit"
              className="min-h-[36px] min-w-[36px] rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-[#DDFB82] hover:text-[#0D0F0E] transition-colors cursor-pointer"
            >
              <DotsThree size={18} weight="bold" />
            </button>
            <button
              onClick={onRunAudit}
              disabled={isAuditing}
              title="Re-evaluate with Gemini"
              className="min-h-[36px] min-w-[36px] rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-[#DDFB82] hover:text-[#0D0F0E] transition-colors cursor-pointer"
            >
              <ArrowUpRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Stadium Tick-Ring Inspired directly by IMG_5846_9eff926d.jpeg */}
        <div className="mt-4 relative rounded-full border-[6px] border-dashed border-[#168B7A]/80 dark:border-[#168B7A] bg-[#F8FAF9] dark:bg-[#111413] px-6 py-5 flex items-center justify-center gap-4">
          <span className="text-5xl font-bold tracking-tight text-[#0D0F0E] dark:text-white tabular-nums">
            {tender.leadScore}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              {tender.grade}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#DDFB82] px-2.5 py-0.5 text-[11px] font-bold text-[#0D0F0E]">
              → {tender.statusLabel}
            </span>
          </div>
        </div>

        {/* Fine Segmented Progress Bar mirroring tick density */}
        <div className="mt-3 grid grid-cols-24 gap-0.5 px-1" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, idx) => {
            const filled = idx < Math.round(activeTicks / 2);
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-xs transition-colors ${
                  filled ? 'bg-[#168B7A]' : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              />
            );
          })}
        </div>

        {/* Bullet Insights List matching IMG_5846_9eff926d.jpeg */}
        <ul className="mt-5 space-y-3 text-xs">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-[#168B7A]/15 text-[#168B7A] flex items-center justify-center shrink-0">
              <CheckCircle size={13} weight="bold" />
            </span>
            <span className="text-neutral-600 dark:text-neutral-300">
              Award timeframe is{' '}
              <strong className="font-semibold text-[#0D0F0E] dark:text-white">
                {tender.purchaseTimeframe}
              </strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-[#168B7A]/15 text-[#168B7A] flex items-center justify-center shrink-0">
              <ShieldCheck size={13} weight="bold" />
            </span>
            <span className="text-neutral-600 dark:text-neutral-300">
              Procurement procedure is{' '}
              <strong className="font-semibold text-[#0D0F0E] dark:text-white">
                {tender.procurementType}
              </strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-[#168B7A]/15 text-[#168B7A] flex items-center justify-center shrink-0">
              <WarningCircle size={13} weight="bold" />
            </span>
            <span className="text-neutral-600 dark:text-neutral-300">
              Clause alignment:{' '}
              <strong className="font-semibold text-[#0D0F0E] dark:text-white tabular-nums">
                {compliantCount}/{tender.clauses.length} verified
              </strong>{' '}
              ({openDiscrepancies} open flags)
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-[#168B7A]/15 text-[#168B7A] flex items-center justify-center shrink-0">
              <CheckCircle size={13} weight="bold" />
            </span>
            <span className="text-neutral-600 dark:text-neutral-300">
              Estimated contract value is{' '}
              <strong className="font-semibold text-[#0D0F0E] dark:text-white tabular-nums">
                {tender.budget}
              </strong>
            </span>
          </li>
        </ul>
      </div>

      <button
        onClick={onRunAudit}
        disabled={isAuditing}
        className="mt-5 w-full min-h-[44px] rounded-2xl bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] hover:opacity-90 transition-opacity text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
      >
        <ShieldCheck size={16} weight="bold" />
        <span>{isAuditing ? 'Auditing Against Vector Vault...' : 'Run Full AI Compliance Audit'}</span>
      </button>
    </div>
  );
}
