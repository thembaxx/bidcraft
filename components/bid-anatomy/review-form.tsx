'use client';

import { useState } from 'react';
import type { ClauseReview, TenderClause } from '@/lib/types';
import { formatSouthAfricanDate } from '@/lib/locale';

export function ReviewForm({ clause, blocker, onReview }: {
  clause: TenderClause;
  blocker: string | null;
  onReview: (outcome: ClauseReview['outcome'], note: string) => boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submitReview = (outcome: ClauseReview['outcome']) => {
    if (outcome === 'approved' && (!acknowledged || blocker)) return;
    if (outcome === 'changes-requested' && !note.trim()) { setError('Describe the changes needed.'); return; }
    setError('');
    if (!onReview(outcome, note)) return;
    setAcknowledged(false);
    setNote('');
  };
  return <section className="anatomy-review" aria-label="Human review">
    <h5>Record your review</h5>
    <p>Saved in this browser as “Local reviewer”, with a proposal snapshot. AI alignment and human approval are separate records.</p>
    {clause.review && <div className="anatomy-last-review" role="status">
      <strong>{clause.review.outcome === 'approved' ? 'Human approval recorded' : 'Changes requested'}</strong>
      <span>{formatSouthAfricanDate(clause.review.reviewedAt, true)} SAST · {clause.review.reviewer}</span>
      <p>{clause.review.note}</p>
    </div>}
    <label className="anatomy-field"><span>Review note</span><textarea value={note} onChange={(event) => { setNote(event.target.value); setError(''); }} rows={3} maxLength={4000} placeholder="What did you check, or what needs to change?" /></label>
    <label className="anatomy-ack"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I checked the requirement, response, and linked evidence.</span></label>
    {blocker && <p className="anatomy-blocker">{blocker}</p>}
    {error && <p role="alert" className="anatomy-blocker">{error}</p>}
    <div className="anatomy-actions"><button type="button" className="anatomy-primary" disabled={!acknowledged || Boolean(blocker)} onClick={() => submitReview('approved')}>Approve reviewed response</button><button type="button" className="anatomy-secondary" onClick={() => submitReview('changes-requested')}>Request changes</button></div>
  </section>;
}
