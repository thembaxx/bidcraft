import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/brand-logo';
import { MobileGlobalNav } from '@/components/mobile-global-nav';
import { TenderRealityCheck } from '@/components/tender-discovery/reality-check';

export const metadata: Metadata = {
  title: 'Tender Reality Check',
  description: 'Review South African tender suitability with source-aware requirements, self-reported supplier answers and a preparation checklist. Not an official eligibility determination.',
};

export default async function RealityCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) return <main id="workspace" className="mx-auto max-w-lg px-5 py-20">
    <h1 className="text-2xl font-bold">Invalid tender reference</h1><Link href="/tenders" className="mt-4 inline-flex min-h-11 text-[#12695C]">Back to Discover</Link>
  </main>;
  return <div className="min-h-dvh bg-[#F8F6EF] text-[#101714] dark:bg-[#0D0F0E] dark:text-[#F5F7F6]">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
      <BrandWordmark/><Link href="/tenders" className="min-h-11 content-center text-xs font-bold text-[#12695C] dark:text-[#9BDBBE]">Discover tenders</Link>
    </header>
    <TenderRealityCheck id={id}/>
    <MobileGlobalNav/>
  </div>;
}
