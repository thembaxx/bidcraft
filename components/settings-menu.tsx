'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight, BookOpenText, Check, Database, Desktop, GearSix,
  Moon, ShieldCheck, Sun,
} from '@phosphor-icons/react';
import { PWAInstallControl } from '@/components/pwa-controls';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/components/theme-preference';

const themeOptions = [
  { id: 'system', label: 'System', icon: Desktop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
] as const;

const helpLinks = [
  { href: '/about#sa-bidding-guide', label: 'Bidding guide', icon: BookOpenText },
  { href: '/data-sources', label: 'Data sources', icon: Database },
  { href: '/privacy', label: 'Privacy & data', icon: ShieldCheck },
  { href: '/legal', label: 'Legal & AI limitations', icon: ArrowUpRight },
] as const;

/** Secondary controls stay reachable without competing with primary bid actions. */
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const preference = useThemePreference();
  const reducedMotion = useReducedMotion();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusId = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>('button[data-theme-option]')?.focus({ preventScroll: true }));
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusId);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-50 shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-controls={menuId}
        aria-expanded={open}
        title="Settings"
        onClick={() => setOpen((current) => !current)}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-[#101714] transition-colors hover:border-[#168B7A] hover:bg-[#EAF2E7] active:scale-95 dark:border-neutral-700 dark:bg-[#161918] dark:text-[#F5F7F6] dark:hover:bg-[#213328]"
      >
        <GearSix size={21} weight={open ? 'fill' : 'regular'} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={menuId + '-title'}
            initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+0.625rem)] z-50 max-h-[min(75dvh,38rem)] w-[min(21rem,calc(100vw-2rem))] origin-top-right overflow-y-auto rounded-3xl border border-neutral-200 bg-[#F8F6EF] p-4 text-[#101714] shadow-[0_22px_70px_#10171433] dark:border-neutral-700 dark:bg-[#161918] dark:text-[#F5F7F6] sm:p-5"
          >
            <div className="mb-4">
              <h2 id={menuId + '-title'} className="text-base font-bold tracking-tight">Settings</h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Make Bidcraft yours.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Appearance</p>
              <div aria-label="Colour theme" className="grid grid-cols-3 gap-1 rounded-2xl bg-[#E8ECE5] p-1 dark:bg-[#0D0F0E]">
                {themeOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    data-theme-option
                    type="button"
                    aria-label={label + ' theme'}
                    aria-pressed={preference === id}
                    onClick={() => setThemePreference(id as ThemePreference)}
                    className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] font-semibold transition-colors ${preference === id ? 'bg-white text-[#101714] shadow-sm dark:bg-[#DDFB82] dark:text-[#101714]' : 'text-neutral-600 hover:bg-white/60 dark:text-neutral-300 dark:hover:bg-white/10'}`}
                  >
                    <Icon size={18} weight={preference === id ? 'fill' : 'regular'} aria-hidden="true" />
                    <span className="flex items-center gap-1">{label}{preference === id && <Check size={11} weight="bold" aria-hidden="true" />}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">System follows your device appearance automatically.</p>
            </div>
            <div className="my-4 h-px bg-neutral-200 dark:bg-neutral-700" />
            <section aria-label="App and installation">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Application</p>
              <PWAInstallControl variant="menu" />
              <p className="mt-2 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">Saved bids stay in this browser. Live discovery and AI need a connection.</p>
            </section>
            <div className="my-4 h-px bg-neutral-200 dark:bg-neutral-700" />
            <nav aria-label="Help and policies" className="space-y-0.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Help & transparency</p>
              {helpLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-[#E8ECE5] dark:text-neutral-200 dark:hover:bg-white/10">
                  <Icon size={18} className="shrink-0 text-[#168B7A] dark:text-[#9BDBBE]" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
