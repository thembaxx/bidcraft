import type { Metadata } from "next";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-logo";
import { SettingsMenu } from "@/components/settings-menu";
import { MobileGlobalNav } from "@/components/mobile-global-nav";
import { TenderRealityCheck } from "@/components/tender-discovery/reality-check";

export const metadata: Metadata = {
  title: "Tender Reality Check",
  description:
    "Review South African tender suitability with source-aware requirements, self-reported supplier answers and a preparation checklist. Not an official eligibility determination.",
};

export default async function RealityCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id))
    return (
      <main id="workspace" className="mx-auto max-w-lg px-5 py-20">
        <h1 className="text-2xl font-bold">Invalid tender reference</h1>
        <Link href="/tenders" className="mt-4 inline-flex min-h-11 text-[#12695C]">
          Back to Discover
        </Link>
      </main>
    );
  return (
    <div className="min-h-dvh bg-[#F8F6EF] text-[#101714] dark:bg-[#0D0F0E] dark:text-[#F5F7F6]">
      <header className="relative z-50 mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:px-8">
        <BrandWordmark />
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/tenders"
            aria-label="Discover tenders"
            className="inline-flex min-h-11 items-center text-xs font-bold text-[#12695C] dark:text-[#9BDBBE]"
          >
            <span className="hidden sm:inline">Discover tenders</span>
            <span className="sm:hidden" aria-hidden="true">
              ↗
            </span>
          </Link>
          <SettingsMenu />
        </div>
      </header>
      <TenderRealityCheck id={id} />
      <MobileGlobalNav />
    </div>
  );
}
