'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowsClockwise, BookmarkSimple, MagnifyingGlass, Moon, Sun, X } from '@phosphor-icons/react';
import { DEFAULT_FILTERS, type DiscoveryFilters, type DiscoveryResponse, type TenderDetail, type TenderNotice } from '@/lib/discovery/types';
import { filterParams, formatTenderDate, parseFilters, searchIndex } from '@/lib/discovery/model';
import { importNoticeToWorkspace, isDiscoveryResponse, readDiscoveryCache, readSavedOpportunities, rememberDiscovery, writeSavedOpportunities } from '@/lib/discovery/storage';
import { DiscoverySearch } from './filters';
import { NoticeCard } from './notice-card';
import { NoticeDetail } from './notice-detail';

const subscribeHydration = () => () => {};
const themeKey = 'quora_bid_architect_theme_v1';

export default function TenderDiscovery() {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  return hydrated ? <DiscoveryClient /> : <p className="discovery-opening" role="status">Opening tender discovery…</p>;
}

function DiscoveryClient() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const savedView = params.get('view') === 'saved';
  let filters: DiscoveryFilters;
  try { filters = parseFilters(new URLSearchParams(params.toString())); } catch { filters = DEFAULT_FILTERS; }
  if (savedView && !params.has('notices')) filters = { ...filters, notices: 'all' };
  const query = filterParams(filters).toString();
  const [saved, setSaved] = useState(readSavedOpportunities);
  const [cache, setCache] = useState(readDiscoveryCache);
  const [reload, setReload] = useState(0);
  const [network, setNetwork] = useState<{ key: string; data?: DiscoveryResponse; error?: string }>();
  const [selected, setSelected] = useState<TenderNotice | null>(null);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now);
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem(themeKey) === 'dark'; } catch { return false; } });
  const requestKey = `${query}|${reload}`;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(themeKey, darkMode ? 'dark' : 'light'); } catch { /* The selected theme still works. */ }
  }, [darkMode]);

  useEffect(() => {
    if (savedView) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/tenders?${query}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]) });
        const data: unknown = await response.json();
        if (!response.ok || !isDiscoveryResponse(data)) throw new Error('The official source could not be refreshed. Try again shortly.');
        if (controller.signal.aborted) return;
        setNetwork({ key: requestKey, data });
        setCache((current) => ({ ...current, [query]: data }));
        rememberDiscovery(query, data);
      } catch {
        if (!controller.signal.aborted) setNetwork({ key: requestKey, error: 'The official source could not be refreshed. Try again shortly.' });
      }
    })();
    return () => controller.abort();
  }, [query, requestKey, savedView]);

  const busy = !savedView && network?.key !== requestKey;
  const error = !savedView && network?.key === requestKey ? network.error : undefined;
  const savedResult = searchIndex({ notices: saved.map((item) => item.notice), sourceTotal: saved.length, complete: true, checkedAt: saved[0]?.savedAt ?? new Date(now).toISOString() }, filters, now);
  const response = savedView ? savedResult : network?.key === requestKey && network.data ? network.data : cache[query];
  const stale = !savedView && Boolean(error || response?.stale || response && now - Date.parse(response.checkedAt) > 20 * 60000);

  const navigate = (next: DiscoveryFilters, view = savedView) => {
    const search = filterParams(next);
    if (view) { search.set('view', 'saved'); search.set('notices', next.notices); }
    setSelected(null); router.push(`/tenders${search.size ? `?${search}` : ''}`, { scroll: false });
  };
  const apply = (form: FormData) => {
    const search = new URLSearchParams();
    for (const [key, value] of form.entries()) if (typeof value === 'string') search.set(key, value);
    try { navigate(parseFilters(search)); } catch (error) { setMessage(error instanceof Error ? error.message : 'Check your filters.'); }
  };
  const toggleSave = (notice: TenderNotice, detail?: TenderDetail) => {
    try {
      // Re-read before writing so two tabs do not silently discard each other's saves.
      const current = readSavedOpportunities();
      const exists = current.some((item) => item.notice.id === notice.id);
      const next = exists ? current.filter((item) => item.notice.id !== notice.id) : [{ notice, ...(detail ? { detail } : {}), savedAt: new Date().toISOString() }, ...current];
      writeSavedOpportunities(next); setSaved(next);
      setMessage(exists ? 'Tender removed from your saved list.' : 'Tender saved in this browser.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'This tender could not be saved.'); }
  };
  const createWorkspace = (notice: TenderNotice) => {
    try { importNoticeToWorkspace(notice); router.push('/#bid-studio'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Browser storage is unavailable. Your workspace has not been changed.'); }
  };
  const selectedSaved = saved.find((item) => item.notice.id === selected?.id);
  const chips = (['q', 'province', 'category', 'buyer', 'type', 'closing', 'published', 'briefing'] as const).filter((key) => filters[key] !== DEFAULT_FILTERS[key]);
  const chipText = (key: typeof chips[number]) => key === 'closing' ? `Closes in ${filters.closing} days` : key === 'published' ? `Published in ${filters.published} days` : key === 'briefing' ? `Briefing: ${filters.briefing}` : filters[key];

  return <div className="discovery-app">
    <div className="discovery-toolbar">
      <nav className="discovery-views" aria-label="Tender discovery views"><Link scroll={false} href={`/tenders${query ? `?${query}` : ''}`} aria-current={!savedView ? 'page' : undefined}>Discover</Link><Link scroll={false} href="/tenders?view=saved" aria-current={savedView ? 'page' : undefined}><BookmarkSimple size={16} aria-hidden="true" /> Saved <span>{saved.length}</span></Link></nav>
      <div className="discovery-toolbar-actions"><span className="discovery-country">South Africa <span aria-hidden="true">·</span> ZA</span><button type="button" className="discovery-icon-button" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark and light theme">{darkMode ? <Sun size={19} /> : <Moon size={19} />}</button></div>
    </div>
    <DiscoverySearch key={`${query}|${savedView}`} filters={filters} facets={response?.facets} busy={busy} onApply={apply} onReset={() => navigate({ ...DEFAULT_FILTERS, notices: savedView ? 'all' : 'opportunities' })}>
      <div className="discovery-results-heading"><div><h2 id="discovery-results-title">{savedView ? 'Your saved tenders' : 'Find your next opportunity'}</h2><p role="status">{busy && !response ? 'Checking National Treasury’s advertised notices…' : response ? `${response.total.toLocaleString('en-ZA')} ${response.total === 1 ? 'notice' : 'notices'}${savedView ? ' saved in this browser' : ' match your search'}` : 'Search official South African tender notices'}</p></div>
        <label className="discovery-sort"><span className="sr-only">Sort results</span><select name="sort" value={filters.sort} onChange={(event) => navigate({ ...filters, sort: event.target.value as DiscoveryFilters['sort'], page: 1 })}><option value="newest">Newest first</option><option value="closing">Closing soonest</option></select></label>
      </div>
      {chips.length > 0 && <div className="discovery-chips" aria-label="Active filters">{chips.map((key) => <button type="button" key={key} aria-label={`Remove ${key} filter`} onClick={() => navigate({ ...filters, [key]: DEFAULT_FILTERS[key], page: 1 })}>{chipText(key)}<X size={13} aria-hidden="true" /></button>)}</div>}
      {error && <div className="discovery-alert" role="alert"><p>{response ? 'Showing the last successful results for these filters. The official source could not be refreshed.' : error}</p><button type="button" onClick={() => setReload(reload + 1)}>Try again</button></div>}
      {response && !response.complete && !savedView && <p className="discovery-alert" role="status">The source collection changed or reached the retrieval limit. These filters cover {response.indexed.toLocaleString('en-ZA')} retrieved notices; more may be available on the official portal.</p>}
      {response && !savedView && <div className="discovery-freshness"><span className={stale ? 'is-stale' : ''}>{stale ? 'Cached source results' : 'Official source records'} <span aria-hidden="true">·</span> Checked {formatTenderDate(response.checkedAt, true)} SAST</span><button type="button" disabled={busy} onClick={() => setReload(reload + 1)} aria-label="Refresh tender results"><ArrowsClockwise size={15} className={busy ? 'discovery-refreshing' : ''} aria-hidden="true" /><span>{busy ? 'Checking' : 'Refresh'}</span></button></div>}
      {savedView && <p className="discovery-saved-note">Saved copies stay on this device. Open a notice to check its latest details before you bid.</p>}
      {busy && !response ? <div className="discovery-skeletons" role="status" aria-label="Loading official tenders">{[1, 2, 3, 4].map((item) => <div key={item}><span /><span /><span /></div>)}</div> : response?.items.length ? <motion.div key={query + '|' + response.page} className="discovery-notices" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: 'easeOut' }}>{response.items.map((notice) => <NoticeCard key={notice.id} notice={notice} now={now} saved={saved.some((item) => item.notice.id === notice.id)} onOpen={() => { setSelected(notice); setMessage(''); }} onSave={() => toggleSave(notice)} />)}</motion.div> : <div className="discovery-empty"><span className="discovery-empty-icon">{savedView ? <BookmarkSimple size={30} /> : <MagnifyingGlass size={30} />}</span><h3>{error ? 'The source is taking a break.' : savedView && !saved.length ? 'Make room for your next bid.' : 'No tenders match these filters.'}</h3><p>{error ? 'Try again in a moment, or browse the official portal. Your saved tenders remain available.' : savedView && !saved.length ? 'Save opportunities as you browse. They’ll be here when you’re ready to take a closer look.' : 'Try a broader keyword, another province, or clear a filter.'}</p>{savedView ? <Link className="discovery-primary" href="/tenders">Discover tenders <ArrowRight size={17} /></Link> : error ? <a className="discovery-secondary" href="https://www.etenders.gov.za/" target="_blank" rel="noopener noreferrer">Open official portal ↗</a> : <button type="button" className="discovery-secondary" onClick={() => navigate(DEFAULT_FILTERS)}>Clear filters</button>}</div>}
      {response && response.total > response.pageSize && <nav className="discovery-pagination" aria-label="Tender results pages"><button type="button" className="discovery-secondary" disabled={response.page <= 1 || busy} onClick={() => navigate({ ...filters, page: response.page - 1 })}><ArrowLeft size={16} aria-hidden="true" /> Previous</button><span>Page {response.page} of {Math.ceil(response.total / response.pageSize)}</span><button type="button" className="discovery-secondary" disabled={response.page * response.pageSize >= response.total || busy} onClick={() => navigate({ ...filters, page: response.page + 1 })}>Next <ArrowRight size={16} aria-hidden="true" /></button></nav>}
    </DiscoverySearch>
    <footer className="discovery-source-footer"><p>Official notices. A clearer starting point.</p><p>Data from <a href="https://www.etenders.gov.za/" target="_blank" rel="noopener noreferrer">National Treasury eTender <ArrowUpRight size={13} aria-hidden="true" /></a>. Coverage is incomplete. Check the original documents, amendments and deadlines before submitting. <Link href="/data-sources">Learn about data quality &amp; licensing</Link>.</p></footer>
    {message && !selected && <div role="status" className="discovery-toast"><p>{message}</p><button type="button" className="discovery-icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}><X size={18} /></button></div>}
    {selected && <NoticeDetail key={selected.id} notice={selected} saved={selectedSaved} feedback={message} onSave={toggleSave} onImport={createWorkspace} onClose={() => { setSelected(null); setMessage(''); }} />}
  </div>;
}
