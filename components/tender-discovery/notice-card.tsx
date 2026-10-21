'use client';

import { ArrowUpRight, BookmarkSimple, CalendarBlank, MapPin, Paperclip } from '@phosphor-icons/react';
import { formatTenderDate } from '@/lib/discovery/model';
import type { TenderNotice } from '@/lib/discovery/types';

export function NoticeCard({ notice, saved, now, onOpen, onSave }: { notice: TenderNotice; saved: boolean; now: number; onOpen: () => void; onSave: () => void }) {
  const passed = notice.closesAt && Date.parse(notice.closesAt) < now;
  return <article className="discovery-notice" aria-label={`Tender ${notice.reference}`}>
    <div className="discovery-notice-body">
      <div className="discovery-notice-kicker"><span className="discovery-reference">{notice.reference}</span><span className="discovery-source"><span aria-hidden="true" /> National Treasury</span></div>
      <h3><button type="button" onClick={onOpen}>{notice.title}<ArrowUpRight size={20} aria-hidden="true" /></button></h3>
      <p className="discovery-buyer">{notice.buyer || 'Buyer not published'}</p>
      <div className="discovery-notice-meta"><span><MapPin size={15} aria-hidden="true" />{notice.province || 'Province not published'}</span><span><CalendarBlank size={15} aria-hidden="true" />{passed ? 'Deadline passed' : 'Closes'} {formatTenderDate(notice.closesAt)}</span>{notice.documentCount > 0 && <span><Paperclip size={15} aria-hidden="true" />{notice.documentCount} {notice.documentCount === 1 ? 'document' : 'documents'}</span>}</div>
      <div className="discovery-notice-tags"><span>{notice.category || 'Category not published'}</span>{notice.briefing === 'required' && <span className="discovery-briefing-tag">Compulsory briefing</span>}{notice.noticeKind !== 'opportunity' && <span>{notice.noticeKind === 'results' ? 'Result notice' : 'Information request'}</span>}</div>
    </div>
    <button type="button" className="discovery-bookmark" onClick={onSave} aria-label={`${saved ? 'Unsave' : 'Save'} tender ${notice.reference}`} aria-pressed={saved}><BookmarkSimple size={21} weight={saved ? 'fill' : 'regular'} aria-hidden="true" /><span>{saved ? 'Saved' : 'Save'}</span></button>
  </article>;
}
