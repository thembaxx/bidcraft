import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BrandWordmark } from '@/components/brand-logo';
import TenderDiscovery from '@/components/tender-discovery/discovery';
import { getSiteUrl } from '@/lib/site';
import '@/components/tender-discovery/discovery.css';

export const metadata: Metadata = {
  title: 'Find South African tenders',
  description: 'Find South African public tenders from National Treasury. Filter by province, category, buyer and closing date. Save opportunities and start your bid in Bidcraft.',
  ...(getSiteUrl() ? { alternates: { canonical: '/tenders' }, openGraph: { url: '/tenders', title: 'Find South African tenders — Bidcraft', locale: 'en_ZA' } } : {}),
};

export default function TendersPage() {
  return <div className="discovery-page"><header className="discovery-site-header"><BrandWordmark /><nav aria-label="Main navigation"><Link href="/#workspace">My bid workspace <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></Link></nav></header>
    <main id="workspace" className="discovery-main"><div className="discovery-intro"><p className="discovery-eyebrow">A good bid starts with the right opportunity</p><h1>Find your next <span>big opportunity.</span></h1><p>South African tenders, straight from official sources. Find the right fit, then make it yours.</p></div><Suspense fallback={<p role="status" className="discovery-opening">Opening tender discovery…</p>}><TenderDiscovery /></Suspense></main>
  </div>;
}
