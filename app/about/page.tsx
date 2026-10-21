import Link from 'next/link';
import type { Metadata } from 'next';
import { BrandWordmark } from '@/components/brand-logo';
import { getSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'A more considered way to bid',
  description: 'How Bidcraft brings tender requirements, evidence-backed proposal drafts, compliance review, and version history into one workspace.',
  ...(getSiteUrl() ? { alternates: { canonical: '/about' }, openGraph: { url: '/about', title: 'A more considered way to bid — Bidcraft' } } : {}),
};
const steps = [
  ['01', 'Bring the brief into focus.', 'Create a tender workspace, then import a scanned page, PDF, or pasted requirements. Review extracted clauses before relying on them.'],
  ['02', 'Give every claim a source.', 'Search the evidence library and draft responses against the documents provided. Compare the requirement and your response side by side.'],
  ['03', 'Make room for a second look.', 'Run an AI compliance review to surface gaps and suggested wording. Check the original evidence and obtain professional sign-off before submission.'],
  ['04', 'Keep the story of every draft.', 'Save snapshots, compare revisions, restore earlier proposal content, and export a Markdown proposal for your submission process.'],
];
export default function About() {
  return <div className="mx-auto max-w-5xl px-6 py-6 sm:px-10">
    <header className="flex items-center justify-between"><BrandWordmark /><Link href="/#workspace" className="rounded-full bg-[#101714] px-5 py-3 text-xs font-semibold text-white">Open workspace →</Link></header>
    <main id="workspace" className="py-20">
      <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-[#168B7A]">The Bidcraft approach</p>
      <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-[-.055em] sm:text-7xl">A little more craft.<br /><span className="font-serif italic text-[#168B7A]">A better bid.</span></h1>
      <p className="mt-8 max-w-xl text-base leading-8 text-neutral-500">A strong proposal is built in the details: a clear requirement, the right evidence, and a response you can stand behind. Bidcraft brings those details together.</p>
      <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2">{steps.map(([number, title, description]) => <section key={number} className="border-t border-neutral-300 pt-5"><p className="font-mono text-xs text-[#168B7A]">{number}</p><h2 className="mb-3 mt-4 text-xl font-bold tracking-tight">{title}</h2><p className="text-sm leading-7 text-neutral-500">{description}</p></section>)}</div>
      <section className="mt-16 rounded-3xl bg-white p-7 dark:bg-[#161918]">
        <h2 className="text-2xl font-bold tracking-tight">A few useful things to know.</h2>
        <div className="mt-6 space-y-5 text-sm leading-7">
          <div><h3 className="font-bold">Where are my proposals stored?</h3><p className="text-neutral-500">Tender work is saved in this browser’s local storage. It does not sync across devices. Export important drafts; clearing site data removes local work.</p></div>
          <div><h3 className="font-bold">What can I do offline?</h3><p className="text-neutral-500">After visiting online, the installed app can cache the workspace. Local edits, snapshots, exports, and local text search work without an AI connection. AI drafting, audits, and OCR need server configuration and a connection.</p></div>
          <div><h3 className="font-bold">Are the example records real company evidence?</h3><p className="text-neutral-500">The included tenders and evidence are demonstration content. They do not establish your organization’s certifications, insurance, or capabilities.</p></div>
          <div><h3 className="font-bold">Does a compliance score guarantee eligibility?</h3><p className="text-neutral-500">Scores and generated wording are review aids. Validate all claims, contractual commitments, and eligibility requirements with the source documents and your bid team.</p></div>
        </div>
      </section>
      <Link href="/#workspace" className="mt-10 inline-flex rounded-full bg-[#DDFB82] px-6 py-4 text-sm font-bold text-[#101714]">Let’s craft your next bid →</Link>
    </main>
  </div>;
}
