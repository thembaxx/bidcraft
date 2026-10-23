import Link from "next/link";
import type { Metadata } from "next";
import { BrandWordmark } from "@/components/brand-logo";
import { SettingsMenu } from "@/components/settings-menu";
import { getSiteUrl } from "@/lib/site";
import { SouthAfricanBidGuide } from "@/components/south-african-bid-guide";
import { AboutFaq } from "@/components/about-faq";

export const metadata: Metadata = {
  title: "A more considered way to bid",
  description:
    "A South African bid workflow with CSD, SARS and B-BBEE guidance, evidence-backed proposals, compliance review and version history.",
  ...(getSiteUrl()
    ? {
        alternates: { canonical: "/about" },
        openGraph: { url: "/about", title: "A more considered way to bid — Bidcraft" },
      }
    : {}),
};
const steps = [
  [
    "01",
    "Bring the brief into focus.",
    "Create a tender workspace, then import a scanned page, PDF, or pasted requirements. Review extracted clauses before relying on them.",
  ],
  [
    "02",
    "Give every claim a source.",
    "Search the evidence library and draft responses against the documents provided. Compare the requirement and your response side by side.",
  ],
  [
    "03",
    "Make room for a second look.",
    "Run an AI compliance review to surface gaps and suggested wording. Check the original evidence and obtain professional sign-off before submission.",
  ],
  [
    "04",
    "Keep the story of every draft.",
    "Save snapshots, compare revisions, restore earlier proposal content, and export a Markdown proposal for your submission process.",
  ],
];
export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6 sm:px-10">
      <header className="relative z-50 flex items-center justify-between gap-2">
        <BrandWordmark />
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/#workspace"
            aria-label="Open workspace"
            className="inline-flex min-h-11 items-center rounded-full bg-[#101714] px-3 text-xs font-semibold text-white sm:px-5"
          >
            <span className="hidden sm:inline">Open workspace&nbsp;</span>
            <span aria-hidden="true">→</span>
          </Link>
          <SettingsMenu />
        </div>
      </header>
      <main id="workspace" className="py-20">
        <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-[#168B7A]">
          The Bidcraft approach
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-[-.055em] sm:text-7xl">
          A little more craft.
          <br />
          <span className="font-serif italic text-[#168B7A]">A better bid.</span>
        </h1>
        <p className="mt-8 max-w-xl text-base leading-8 text-neutral-500">
          Built for South African bid teams. A strong proposal starts with a clear requirement, the
          right evidence, and a response you can stand behind. Bidcraft brings those details
          together.
        </p>
        <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {steps.map(([number, title, description]) => (
            <section key={number} className="border-t border-neutral-300 pt-5">
              <p className="font-mono text-xs text-[#168B7A]">{number}</p>
              <h2 className="mb-3 mt-4 text-xl font-bold tracking-tight">{title}</h2>
              <p className="text-sm leading-7 text-neutral-500">{description}</p>
            </section>
          ))}
        </div>
        <section className="mt-16 rounded-3xl bg-white p-7 dark:bg-[#161918]">
          <h2 className="text-2xl font-bold tracking-tight">A few useful things to know.</h2>
          <div className="mt-6">
            <AboutFaq />
          </div>
        </section>
        <section id="sa-bidding-guide" className="mt-10 scroll-mt-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            Prepare for a South African bid.
          </h2>
          <SouthAfricanBidGuide />
        </section>
        <nav
          aria-label="Legal and data notices"
          className="mt-10 flex flex-wrap gap-4 text-sm font-semibold text-[#12695C] dark:text-[#9BDBBE]"
        >
          <Link href="/privacy">Privacy notice</Link>
          <Link href="/terms">Terms of use</Link>
          <Link href="/data-sources">Data sources</Link>
          <Link href="/ai-disclosure">AI limitations</Link>
        </nav>
        <Link
          href="/#workspace"
          className="mt-10 inline-flex rounded-full bg-[#DDFB82] px-6 py-4 text-sm font-bold text-[#101714]"
        >
          Let’s craft your next bid →
        </Link>
      </main>
    </div>
  );
}
