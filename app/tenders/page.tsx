import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BrandWordmark } from '@/components/brand-logo';
import { SettingsMenu } from '@/components/settings-menu';
import TenderDiscovery from '@/components/tender-discovery/discovery';
import { MobileGlobalNav } from '@/components/mobile-global-nav';
import { getSiteUrl } from '@/lib/site';
import '@/components/tender-discovery/discovery.css';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'Find South African tenders',
  description: 'Find South African public tenders from National Treasury. Filter by province, category, buyer and closing date. Save opportunities and start your bid in Bidcraft.',
  ...(getSiteUrl() ? { alternates: { canonical: '/tenders' }, openGraph: { url: '/tenders', title: 'Find South African tenders — Bidcraft', locale: 'en_ZA' } } : {}),
};

export default function TendersPage() {
  return <div className="discovery-page"><header className="discovery-site-header relative z-50"><BrandWordmark /><div className="flex shrink-0 items-center gap-2 sm:gap-4"><nav aria-label="Main navigation"><Link className="hidden sm:inline-flex" href="/today">Today</Link><Link href="/#workspace" aria-label="Open my bid workspace"><span className="hidden sm:inline">My bid workspace</span><span aria-hidden="true">↗</span></Link></nav><SettingsMenu /></div></header>
    <main id="workspace" className="discovery-main"><ScrollReveal className="discovery-intro"><p className="discovery-eyebrow">A good bid starts with the right opportunity</p><h1>Find your next <span>big opportunity.</span></h1><p>South African tenders listed by National Treasury, independently presented. Check the original notices before bidding.</p></ScrollReveal><Suspense fallback={<p role="status" className="discovery-opening">Opening tender discovery…</p>}><TenderDiscovery /></Suspense></main><MobileGlobalNav />
  </div>;
}
