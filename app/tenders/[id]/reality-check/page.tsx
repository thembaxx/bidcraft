import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/brand-logo';
import { MobileGlobalNav } from '@/components/mobile-global-nav';
import { TenderRealityCheck } from '@/components/tender-discovery/reality-check';

export const metadata: Metadata = {
  title: 'Tender Reality Check',
  description: 'Review a South African tender against your self-reported business details and source-linked requirements, without claiming verified eligibility.',
  robots: { index: false, follow: false },
};

export default async function RealityCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) notFound();
  return <div className="min-h-dvh bg-[#F8F6EF] text-[#101714] dark:bg-[#0D0F0E] dark:text-[#F5F7F6]">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 border-b border-neutral-200/70 px-4 py-5 dark:border-neutral-800 sm:px-8">
      <BrandWordmark />
      <Link className="hidden text-sm font-semibold text-[#12695C] dark:text-[#9BDBBE] sm:inline-flex" href="/tenders">Back to tender discovery →</Link>
    </header>
    <TenderRealityCheck id={id} />
    <MobileGlobalNav />
  </div>;
}
