'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Briefcase, Buildings, Check, Compass, FileText,
  MapPin, MagnifyingGlass, Sparkle, X,
} from '@phosphor-icons/react';
import { BrandLogoMark } from '@/components/brand-logo';
import {
  emptyOnboardingProfile, ONBOARDING_REPLAY_EVENT, onboardingDestination,
  PROVINCES, readOnboarding, saveOnboarding, type OnboardingGoal, type OnboardingProfile,
} from '@/lib/onboarding';

const goals = [
  { id: 'discover', title: 'Find tenders', detail: 'Discover work worth bidding for.', Icon: MagnifyingGlass },
  { id: 'prepare', title: 'Prepare a bid', detail: 'Organise requirements and evidence.', Icon: FileText },
  { id: 'both', title: 'A little of both', detail: 'Find opportunities and build a stronger bid.', Icon: Briefcase },
] as const;

const suggestions = ['Software', 'Cleaning', 'Construction', 'Security', 'Transport'] as const;

const questions = [
  { title: 'What brings you here?', subtitle: 'We’ll show you a useful place to start.' },
  { title: 'Where do you take on work?', subtitle: 'Focus your search on a province, or keep it nationwide.' },
  { title: 'What does your business offer?', subtitle: 'A keyword helps tailor your first tender search. Optional.' },
] as const;

/** Short, replayable device-local welcome flow. It does not modify any saved bids. */
export function OnboardingExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(emptyOnboardingProfile);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shownThisSession = useRef(false);
  const savedBeforeReplay = useRef<ReturnType<typeof readOnboarding>>(null);

  // Don't interrupt a visitor who only wants to read the legal notices.
  useEffect(() => {
    if (!['/', '/today', '/tenders'].includes(pathname)) return;
    if (shownThisSession.current || readOnboarding()) return;
    shownThisSession.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- First-run detection reads browser persistence after hydration.
    setOpen(true);
  }, [pathname]);

  useEffect(() => {
    const replay = () => {
      savedBeforeReplay.current = readOnboarding();
      setProfile(savedBeforeReplay.current ?? emptyOnboardingProfile);
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_REPLAY_EVENT, replay);
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  const skip = () => {
    // Replaying and closing without finishing never overwrites a prior profile.
    if (!savedBeforeReplay.current) saveOnboarding('skipped', profile);
    setOpen(false);
    savedBeforeReplay.current = null;
  };

  const finish = () => {
    saveOnboarding('completed', profile);
    setOpen(false);
    savedBeforeReplay.current = null;
    router.push(onboardingDestination(profile));
  };

  const selectGoal = (goal: OnboardingGoal) => setProfile((current) => ({ ...current, goal }));

  if (!open) return null;

  const isLast = step === questions.length - 1;
  const question = questions[step];
  const progress = (step + 1) / questions.length;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="bidcraft-onboarding-title"
      aria-describedby="bidcraft-onboarding-description"
      onCancel={(event) => { event.preventDefault(); skip(); }}
      className="m-auto max-h-[calc(100dvh-1.25rem)] w-[calc(100%-1.25rem)] max-w-[760px] overflow-y-auto rounded-[28px] border border-neutral-200 bg-[#F8F6EF] p-0 text-[#101714] shadow-[0_26px_90px_#10171455] backdrop:bg-[#07120E]/75 backdrop:backdrop-blur-sm dark:border-neutral-700 dark:bg-[#111715] dark:text-[#F5F7F6] sm:rounded-[36px]"
    >
      <div className="grid min-h-[min(580px,calc(100dvh-1.25rem))] grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(250px,0.9fr)]">
        <div className="flex min-w-0 flex-col px-5 pb-5 pt-5 sm:px-8 sm:pb-7 sm:pt-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BrandLogoMark size={34}/><span className="text-base font-bold tracking-[-0.045em]">bidcraft<span className="text-[#168B7A]">.</span></span></div>
            <button type="button" onClick={skip} aria-label="Skip onboarding" className="grid size-11 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"><X size={19} aria-hidden="true"/></button>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#168B7A] dark:text-[#9BDBBE]">Made for your next bid</span>
            <span className="font-mono text-xs text-neutral-500" aria-live="polite">{step + 1} of {questions.length}</span>
          </div>
          <div role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step + 1} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E3E7DC] dark:bg-[#2B3832]">
            <motion.div className="h-full rounded-full bg-[#168B7A] dark:bg-[#DDFB82]" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}/>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={reducedMotion ? false : { opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} className="min-w-0 flex-1">
              <h2 id="bidcraft-onboarding-title" className="mt-7 max-w-sm text-[clamp(1.8rem,5vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.055em]">{question.title}</h2>
              <p id="bidcraft-onboarding-description" className="mt-2 max-w-sm text-sm leading-6 text-neutral-600 dark:text-neutral-300">{question.subtitle}</p>

              {step === 0 && <div className="mt-6 grid gap-2" role="group" aria-label="Your goal">
                {goals.map(({ id, title, detail, Icon }) => {
                  const selected = profile.goal === id;
                  return <button key={id} type="button" aria-pressed={selected} onClick={() => selectGoal(id)} className={`group flex min-h-[68px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.99] ${selected ? 'border-[#168B7A] bg-[#E6F6E6] dark:border-[#DDFB82] dark:bg-[#24382C]' : 'border-neutral-200 bg-white/70 hover:border-[#168B7A]/60 dark:border-neutral-700 dark:bg-[#1B2320]'}`}>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-[#DDFB82] text-[#101714]' : 'bg-[#EEF0E9] text-[#168B7A] dark:bg-[#2B3A32] dark:text-[#DDFB82]'}`}><Icon size={20} weight={selected ? 'fill' : 'regular'} aria-hidden="true"/></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block text-xs leading-4 text-neutral-500 dark:text-neutral-400">{detail}</span></span>
                    {selected && <Check size={17} weight="bold" className="shrink-0 text-[#168B7A] dark:text-[#DDFB82]" aria-hidden="true"/>}
                  </button>;
                })}
              </div>}

              {step === 1 && <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Where you work">
                {['', ...PROVINCES].map((province) => {
                  const selected = profile.province === province;
                  return <button type="button" key={province || 'national'} onClick={() => setProfile((current) => ({ ...current, province }))} aria-pressed={selected} className={`flex min-h-11 items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition-colors ${!province ? 'col-span-2' : ''} ${selected ? 'border-[#168B7A] bg-[#DDFB82] text-[#101714]' : 'border-neutral-200 bg-white/65 text-neutral-700 hover:border-[#168B7A]/50 dark:border-neutral-700 dark:bg-[#1B2320] dark:text-neutral-200'}`}>
                    <span className="min-w-0">{province || 'Anywhere in South Africa'}</span>
                    {selected && <Check size={16} weight="bold" className="shrink-0" aria-hidden="true" />}
                  </button>;
                })}
              </div>}

              {step === 2 && <div className="mt-7 space-y-4">
                <label htmlFor="onboarding-keyword" className="block text-xs font-bold text-neutral-600 dark:text-neutral-300">Service or product (optional)</label>
                <input id="onboarding-keyword" type="text" autoComplete="off" maxLength={72} value={profile.keyword} placeholder="e.g. website development" onChange={(event) => setProfile((current) => ({ ...current, keyword: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-base outline-none transition-colors focus:border-[#168B7A] dark:border-neutral-700 dark:bg-[#1B2320] dark:text-white"/>
                <div className="flex flex-wrap gap-2" aria-label="Suggestions">
                  {suggestions.map((value) => <button type="button" key={value} aria-pressed={profile.keyword === value} onClick={() => setProfile((current) => ({ ...current, keyword: value }))} className={`min-h-10 rounded-full border px-3 text-xs font-semibold transition-colors ${profile.keyword === value ? 'border-[#168B7A] bg-[#DDFB82] text-[#101714]' : 'border-neutral-200 bg-white/80 hover:border-[#168B7A] dark:border-neutral-700 dark:bg-[#1B2320]'}`}>{value}</button>)}
                </div>
                <p className="rounded-2xl bg-[#E7EDE3] p-3 text-xs leading-5 text-neutral-600 dark:bg-[#1F2C26] dark:text-neutral-300">This simply fills in your first search. Tender matches and eligibility still need your review.</p>
              </div>}
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="grid size-12 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-[#1B2320]" aria-label="Previous question"><ArrowLeft size={18} aria-hidden="true"/></button>}
              <button type="button" disabled={step === 0 && !profile.goal} onClick={() => isLast ? finish() : setStep((current) => current + 1)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#101714] px-5 text-sm font-bold text-white transition-[transform,background-color] hover:bg-[#168B7A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#DDFB82] dark:text-[#101714] dark:hover:bg-[#C5E96D]">
                {isLast ? profile.goal === 'prepare' ? 'Open my workspace' : 'Find my first tender' : 'Continue'} <ArrowRight size={17} weight="bold" aria-hidden="true"/>
              </button>
            </div>
            <p className="text-center text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">No account needed. Preferences stay on this device. <button type="button" className="font-semibold underline underline-offset-2" onClick={skip}>Skip for now</button></p>
          </div>
        </div>

        <div className="relative hidden min-h-full overflow-hidden bg-[#101714] p-7 text-[#F8F6EF] md:flex md:flex-col md:justify-between" aria-hidden="true">
          <div className="absolute -right-24 -top-28 size-80 rounded-full bg-[#168B7A]/30 blur-3xl"/>
          <div className="absolute -bottom-32 -left-24 size-80 rounded-full bg-[#DDFB82]/20 blur-3xl"/>
          <div className="relative"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold"><Sparkle size={15} weight="fill"/> Less admin. More clarity.</div></div>
          <div className="relative -rotate-3 space-y-3">
            <motion.div initial={false} animate={reducedMotion ? {} : { y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="rounded-3xl border border-white/15 bg-[#F8F6EF] p-5 text-[#101714] shadow-2xl">
              <div className="mb-4 flex items-center justify-between"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#DDFB82]"><Compass size={23}/></div><MapPin size={17} className="text-[#168B7A]"/></div>
              <div className="h-2 w-2/3 rounded-full bg-[#101714]/20"/><div className="mt-2 h-2 w-5/6 rounded-full bg-[#101714]/10"/>
              <div className="mt-5 inline-flex rounded-full bg-[#E7F8C6] px-3 py-1.5 text-[11px] font-semibold text-[#12695C]">Your next opportunity</div>
            </motion.div>
            <div className="ml-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#1B2B24] p-4 shadow-xl"><Buildings size={25} className="text-[#DDFB82]"/><span className="text-sm font-semibold">Built for South African businesses</span><Check size={18} className="ml-auto text-[#DDFB82]"/></div>
          </div>
          <div className="relative"><p className="max-w-[230px] text-3xl font-semibold leading-[1.05] tracking-[-0.055em]">Make every <span className="font-serif font-normal italic text-[#DDFB82]">bid count.</span></p></div>
        </div>
      </div>
    </dialog>
  );
}
