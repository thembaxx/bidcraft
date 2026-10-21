'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { MagnifyingGlass, SlidersHorizontal, ArrowRight, X } from '@phosphor-icons/react';
import type { DiscoveryFacets, DiscoveryFilters } from '@/lib/discovery/types';

const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'National', 'North West', 'Northern Cape', 'Western Cape'];

export function DiscoverySearch({ filters, facets, busy, onApply, onReset, children }: {
  filters: DiscoveryFilters; facets?: DiscoveryFacets; busy: boolean;
  onApply: (data: FormData) => void; onReset: () => void; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); onApply(new FormData(event.currentTarget)); setExpanded(false);
  };
  const choices = (items: string[] | undefined) => items?.map((item) => <option key={item} value={item}>{item}</option>);
  return <form onSubmit={submit} className="discovery-search-form" aria-label="Search South African tenders">
    <div className="discovery-search-bar">
      <label className="discovery-query"><MagnifyingGlass size={22} aria-hidden="true" /><span className="sr-only">Search tenders</span><input type="search" name="q" defaultValue={filters.q} maxLength={180} placeholder="What does your business do? Try solar, cleaning, IT…" /></label>
      <button type="submit" className="discovery-primary">Search <ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="discovery-layout">
      <aside className="discovery-filters" data-expanded={expanded} aria-label="Tender filters">
        <div className="discovery-filter-heading"><h2><SlidersHorizontal size={19} aria-hidden="true" /> Refine your search</h2><button type="button" className="discovery-filter-toggle" aria-expanded={expanded} aria-controls="discovery-filter-fields" onClick={() => setExpanded(!expanded)}>{expanded ? 'Close' : 'Filters'} {expanded ? <X size={15} aria-hidden="true" /> : <SlidersHorizontal size={15} aria-hidden="true" />}</button></div>
        <div className="discovery-filter-fields" id="discovery-filter-fields">
          <label>Province<select aria-label="Province" name="province" defaultValue={filters.province}><option value="">All South Africa</option>{choices([...new Set([...provinces, ...(facets?.provinces ?? []), ...(filters.province ? [filters.province] : [])])].sort())}</select></label>
          <label>Category<select aria-label="Category" name="category" defaultValue={filters.category}><option value="">All categories</option>{choices([...new Set([...(facets?.categories ?? []), ...(filters.category ? [filters.category] : [])])])}</select></label>
          <label>Buyer or department<input aria-label="Buyer or department" name="buyer" list="discovery-buyers" defaultValue={filters.buyer} maxLength={180} placeholder="Type or choose a buyer" autoComplete="off" /><datalist id="discovery-buyers">{choices(facets?.buyers)}</datalist></label>
          <label>Closing date<select aria-label="Closing date" name="closing" defaultValue={filters.closing}><option value="any">Any closing date</option><option value="7">In the next 7 days</option><option value="14">In the next 14 days</option><option value="30">In the next 30 days</option></select></label>
          <details className="discovery-more-filters" open={Boolean(filters.type || filters.published !== 'any' || filters.briefing !== 'any' || filters.notices === 'all')}><summary>More filters <span aria-hidden="true">+</span></summary>
            <label>Procurement type<select aria-label="Procurement type" name="type" defaultValue={filters.type}><option value="">All procurement types</option>{choices([...new Set([...(facets?.types ?? []), ...(filters.type ? [filters.type] : [])])])}</select></label>
            <label>Published<select aria-label="Published" name="published" defaultValue={filters.published}><option value="any">Any publication date</option><option value="7">In the last 7 days</option><option value="30">In the last 30 days</option></select></label>
            <label>Briefing session<select aria-label="Briefing session" name="briefing" defaultValue={filters.briefing}><option value="any">Any briefing requirement</option><option value="required">Compulsory briefing</option><option value="optional">Optional briefing</option><option value="none">No briefing listed</option><option value="unknown">Requirement not published</option></select></label>
            <label className="discovery-checkbox"><input type="checkbox" name="notices" value="all" defaultChecked={filters.notices === 'all'} /><span>Include information requests and result notices</span></label>
          </details>
          <button type="submit" className="discovery-primary discovery-apply">Apply filters <ArrowRight size={17} aria-hidden="true" /></button>
          <button type="button" className="discovery-reset" onClick={onReset}>Clear all filters</button>
          <p className="discovery-filter-note">From National Treasury’s advertised notices. Coverage depends on what buyers publish.</p>
        </div>
      </aside>
      <div className="discovery-results" aria-busy={busy}>{children}</div>
    </div>
  </form>;
}
