'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Briefcase, CalendarBlank, CheckCircle, Clock, FileText, Info, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { readSavedOpportunities } from '@/lib/discovery/storage';
import { TENDER_STORAGE_KEY, type SavedTender } from '@/lib/discovery/types';
import { isTender } from '@/lib/validation';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StatusBadge } from '@/components/ui/status-badge';

type TodaySnapshot = { saved: SavedTender[]; activeBids: number };
const EMPTY: TodaySnapshot = { saved: [], activeBids: 0 };

function readSnapshot(): TodaySnapshot {
  let activeBids = 0;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(TENDER_STORAGE_KEY) || '[]');
    if (Array.isArray(value)) activeBids = value.filter(isTender).filter((bid) => !bid.isDemo && bid.stage !== 'close').length;
  } catch { /* An invalid local workspace must not break the dashboard. */ }
  return { saved: readSavedOpportunities(), activeBids };
}

function formatDeadline(value: string | null) {
  if (!value) return 'Deadline not published';
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' }).format(new Date(value)) + ' SAST';
}

function daysRemaining(date: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(date) - now) / 86400000));
}

/** The Today view is intentionally honest about local-only data and does not claim to send background notifications. */
export function TodayDashboard() {
  const [snapshot, setSnapshot] = useState<TodaySnapshot>(EMPTY);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sync = () => { setSnapshot(readSnapshot()); setNow(Date.now()); setReady(true); };
    sync();
    const interval = window.setInterval(sync, 60000);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => { window.clearInterval(interval); window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); };
  }, []);

  const upcoming = snapshot.saved.filter(({ notice }) => notice.closesAt && Date.parse(notice.closesAt) > now)
    .sort((a, b) => Date.parse(a.notice.closesAt!) - Date.parse(b.notice.closesAt!));
  const next = upcoming[0];
  const urgent = upcoming.filter(({ notice }) => daysRemaining(notice.closesAt!, now) <= 7);
  const expired = snapshot.saved.filter(({ notice }) => notice.closesAt && Date.parse(notice.closesAt) <= now).length;
  const intro = reduceMotion ? undefined : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } };

  return <main className="mx-auto max-w-6xl space-y-8 px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
    <motion.section {...intro} className="max-w-2xl space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#168B7A] dark:text-[#9BDBBE]">Your bid workspace</p>
      <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">A clearer way <span className="font-serif font-normal italic text-[#168B7A] dark:text-[#9BDBBE]">forward.</span></h1>
      <p className="max-w-lg text-sm leading-7 text-neutral-600 dark:text-neutral-400">Your saved opportunities, important dates and work in progress — without the noise.</p>
    </motion.section>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {[
        { label: 'Saved opportunities', value: snapshot.saved.length, icon: MagnifyingGlass },
        { label: 'My active bids', value: snapshot.activeBids, icon: Briefcase },
        { label: 'Due within 7 days', value: urgent.length, icon: Clock },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-3xl border border-neutral-200/80 bg-white/75 p-4 dark:border-neutral-800 dark:bg-[#161918] sm:p-6">
        <Icon size={20} weight="regular" className="mb-3 text-[#168B7A] dark:text-[#9BDBBE]" aria-hidden="true"/>
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{ready ? <AnimatedNumber value={value} label={label} /> : '—'}</p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section aria-labelledby="attention-title" className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-[#161918] sm:p-7">
        <div className="mb-5 flex items-center gap-2"><Clock size={20} className="text-[#168B7A] dark:text-[#9BDBBE]" aria-hidden="true"/><h2 id="attention-title" className="text-lg font-bold tracking-tight">Needs your attention</h2></div>
        {!ready ? <p className="text-sm text-neutral-500" role="status">Checking your saved bids…</p> : next ? <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning" dot pulse={daysRemaining(next.notice.closesAt!, now) <= 2}>{daysRemaining(next.notice.closesAt!, now)} days remaining</StatusBadge>
            {next.notice.briefing === 'required' && <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><WarningCircle size={15}/> Compulsory briefing: verify attendance</span>}
          </div>
          <h3 className="text-xl font-semibold leading-snug tracking-tight">{next.notice.title}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{next.notice.buyer || 'Buyer not published'} · {next.notice.reference}</p>
          <p className="flex items-center gap-2 text-sm"><CalendarBlank size={17} className="text-[#168B7A]" aria-hidden="true" />{formatDeadline(next.notice.closesAt)}</p>
          <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">This is your last saved copy. Confirm any extensions, cancellations and required briefings in the official documents.</p>
          <Link href={'/tenders?view=saved&q=' + encodeURIComponent(next.notice.reference)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#DDFB82] px-5 text-xs font-bold text-[#101714] transition-transform hover:-translate-y-0.5">Review this tender <ArrowRight size={16}/></Link>
        </div> : <div className="space-y-4 py-3">
          <CheckCircle size={28} className="text-[#168B7A]" weight="duotone" aria-hidden="true"/>
          <h3 className="text-base font-semibold">Nothing urgent in your saved opportunities.</h3>
          <p className="max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">Find a tender that suits your business, save it, and its published closing date will appear here.</p>
          <Link href="/tenders" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#168B7A] dark:text-[#9BDBBE]">Explore tenders <ArrowRight size={16}/></Link>
        </div>}
      </section>
      <section aria-labelledby="next-title" className="space-y-3">
        <h2 id="next-title" className="text-lg font-bold tracking-tight">Your next steps</h2>
        <Link href="/tenders" className="group flex min-h-24 items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 transition-colors hover:border-[#168B7A]/60 dark:border-neutral-800 dark:bg-[#161918]">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#DDFB82] text-[#101714]"><MagnifyingGlass size={21}/></span>
          <span className="flex-1"><span className="block text-sm font-bold">Discover opportunities</span><span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">Search official South African tender notices.</span></span>
          <ArrowUpRight size={17} className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"/>
        </Link>
        <Link href="/#workspace" className="group flex min-h-24 items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 transition-colors hover:border-[#168B7A]/60 dark:border-neutral-800 dark:bg-[#161918]">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#E8F2EC] text-[#168B7A] dark:bg-[#20332B] dark:text-[#9BDBBE]"><FileText size={21}/></span>
          <span className="flex-1"><span className="block text-sm font-bold">Continue preparing a bid</span><span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">Your clauses, evidence, compliance and proposal history.</span></span>
          <ArrowUpRight size={17} className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"/>
        </Link>
      </section>
    </div>
    <div className="flex items-start gap-2 rounded-2xl bg-[#EAEDE8] p-4 text-xs leading-6 text-neutral-600 dark:bg-[#17211B] dark:text-neutral-300">
      <Info size={18} className="mt-0.5 shrink-0 text-[#168B7A]" aria-hidden="true"/>
      <p>Saved tenders and bids currently live in this browser. Today highlights dates from saved records; it does not send background email or push alerts. {expired ? expired + ' saved deadline(s) have passed. ' : ''}Always verify changes against the official notice.</p>
    </div>
  </main>;
}
