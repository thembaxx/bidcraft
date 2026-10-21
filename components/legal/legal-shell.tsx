import Link from 'next/link';
import { BrandWordmark } from '@/components/brand-logo';
import { legal, legalDetailsComplete } from '@/lib/legal';
import type { ReactNode } from 'react';

const pages = [
  { href: '/legal', name: 'Legal overview' }, { href: '/privacy', name: 'Privacy' },
  { href: '/terms', name: 'Terms' }, { href: '/data-sources', name: 'Data sources' },
  { href: '/ai-disclosure', name: 'AI & limitations' },
];

export function LegalShell({ children, title, subtitle, current }: { children: ReactNode; title: string; subtitle: string; current: string }) {
  return <div id="workspace" className="min-h-dvh bg-[#F8F6EF] text-[#101714] dark:bg-[#0D0F0E] dark:text-[#F5F7F6]">
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
      <BrandWordmark/>
      <Link href="/today" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#12695C] dark:text-[#9BDBBE]">Back to Bidcraft →</Link>
    </header>
    <main className="mx-auto max-w-5xl space-y-8 px-5 pb-20 sm:px-8">
      <div className="space-y-3 pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#168B7A] dark:text-[#9BDBBE]">Trust & transparency</p>
        <h1 className="text-4xl font-semibold tracking-[-.055em] sm:text-5xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">{subtitle}</p>
        <p className="font-mono text-[11px] text-neutral-500">Last updated: {legal.effectiveDate}</p>
      </div>
      <nav aria-label="Legal information" className="flex flex-wrap gap-2">
        {pages.map(({ href, name }) => <Link key={href} href={href} aria-current={current === href ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold transition-colors ${current === href ? 'border-[#168B7A] bg-[#DDFB82] text-[#101714]' : 'border-neutral-200 bg-white hover:border-[#168B7A] dark:border-neutral-700 dark:bg-[#161918]'}`}>{name}</Link>)}
      </nav>
      {!legalDetailsComplete && <div role="note" className="flex gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        <span className="mt-0.5 shrink-0 font-bold" aria-hidden="true">!</span>
        <div><strong>Operator details are not fully published.</strong> The operator must supply verified legal identity, service address, contact email and telephone details before treating these notices as final for public launch. This notice is not a certification of legal compliance.</div>
      </div>}
      <article className="space-y-7 rounded-3xl border border-neutral-200/75 bg-white p-5 text-sm leading-7 dark:border-neutral-800 dark:bg-[#161918] sm:p-8 [&_a]:font-semibold [&_a]:text-[#12695C] dark:[&_a]:text-[#9BDBBE] [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_p]:text-neutral-600 dark:[&_p]:text-neutral-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</article>
      <footer className="flex flex-wrap justify-between gap-3 border-t border-neutral-300/70 py-6 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <span>Bidcraft. Make every bid count.</span><div className="flex flex-wrap gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/data-sources">Data sources</Link><Link href="/ai-disclosure">AI limitations</Link></div>
      </footer>
    </main>
  </div>;
}
