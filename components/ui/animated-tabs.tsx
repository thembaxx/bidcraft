'use client';

// Adapted from EasyUI Animated Tabs. MIT © 2026 Suraj Maurya. See THIRD_PARTY_NOTICES.md.
import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function AnimatedTabs<T extends string>({ tabs, activeTab, onChange }: {
  tabs: { id: T; label: string; badge?: number }[];
  activeTab: T;
  onChange: (id: T) => void;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  return (
    <div role="tablist" aria-label="Tender workspace" className="flex gap-1 overflow-x-auto rounded-2xl bg-[#F8F6EF] p-1 dark:bg-[#0D0F0E]">
      {tabs.map((tab, index) => (
        <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-controls={`panel-${tab.id}`}
          aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            let target: number | undefined;
            if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') target = 0;
            if (event.key === 'End') target = tabs.length - 1;
            if (target !== undefined) { event.preventDefault(); onChange(tabs[target].id); document.getElementById(`tab-${tabs[target].id}`)?.focus(); }
          }}
          className={`relative flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold ${activeTab === tab.id ? 'text-white dark:text-[#0D0F0E]' : 'text-neutral-500 hover:text-[#0D0F0E] dark:hover:text-white'}`}>
          {activeTab === tab.id && <motion.span layoutId={`workspace-tabs-${id}`} className="absolute inset-0 rounded-xl bg-[#0D0F0E] dark:bg-[#DDFB82]" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative z-10">{tab.label}</span>
          {tab.badge !== undefined && <span className="relative z-10 font-mono text-[10px] opacity-70">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
