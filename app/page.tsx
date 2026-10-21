import BidWorkspace from '@/components/bid-workspace';
import { BrandWordmark } from '@/components/brand-logo';
import { BrandScene } from '@/components/brand-scene';
import Link from 'next/link';

export default function Home() {
  return <>
    <header className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 sm:px-8">
      <BrandWordmark />
      <nav aria-label="Main navigation" className="flex items-center gap-5 text-xs font-semibold">
        <Link href="/today" className="hidden min-h-10 items-center text-neutral-500 transition-colors hover:text-[#168B7A] sm:inline-flex">Today</Link>
        <Link href="/tenders" className="inline-flex min-h-10 items-center gap-3 rounded-full bg-[#101714] px-5 text-white transition-colors hover:bg-[#168B7A]">Find tenders <span aria-hidden="true">→</span></Link>
        <a href="#workspace" className="hidden min-h-10 items-center text-neutral-600 sm:inline-flex">Your workspace</a>
      </nav>
    </header>
    <section aria-labelledby="brand-heading" className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-6 px-5 pb-8 pt-3 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:pb-12 lg:pt-5">
      <div className="brand-intro py-5 lg:py-8">
        <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#168B7A]"><span className="h-1.5 w-1.5 rounded-full bg-[#168B7A]" /> Built for South African bid teams</p>
        <h1 id="brand-heading" className="text-[clamp(3rem,10vw,5rem)] lg:text-[clamp(3.5rem,6.4vw,7rem)] font-semibold leading-[0.93] tracking-[-0.065em]">Make every<br />bid <span className="font-serif font-normal italic text-[#168B7A]">count.</span></h1>
        <p className="mt-6 max-w-[430px] text-sm leading-7 text-neutral-500 sm:text-base">Find South African tenders and turn complex requirements into clear, considered proposals. Your evidence, compliance checks, and drafts — beautifully in sync.</p>
        <div className="mt-7 flex flex-wrap items-center gap-5 text-xs font-semibold">
          <a href="#workspace" className="brand-cta inline-flex min-h-12 items-center gap-8 rounded-full bg-[#DDFB82] px-6 text-[#101714]">Let’s craft your next bid <span aria-hidden="true">→</span></a>
          <Link href="/today" className="inline-flex min-h-11 items-center font-semibold text-[#12695C] dark:text-[#9BDBBE]">See what needs attention →</Link>
        </div>
      </div>
      <div className="hidden lg:block"><BrandScene /></div>
    </section>
    <BidWorkspace />
    <footer className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 pb-24 pt-7 text-xs text-neutral-500 lg:pb-8">
      <p>Bidcraft. A little more craft. A better bid.</p>
      <nav aria-label="Footer" className="flex gap-5"><a href="/about">About & guidance</a><a href="/llms.txt">For AI readers</a><a href="/brand/bidcraft-icon-original.png" download>Download the mark →</a></nav>
    </footer>
  </>;
}
