'use client';

import { useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';
import type { CheckStatus, RequestKind } from '@/lib/types';

type Dispute = {
  id: string;
  guideName: string;
  claim: string;
  status: CheckStatus;
  note: string;
  at: string;
  resolved: 'upheld' | 'rejected' | null;
};

type Request = {
  id: string;
  kind: RequestKind;
  targetId: string;
  targetName: string;
  message: string;
  contact: string;
  at: string;
  done?: boolean;
};

export function AdminRequests({
  disputes,
  requests,
}: {
  disputes: Dispute[];
  requests: Request[];
}) {
  const { lang } = useTrip();
  const [rows, setRows] = useState(disputes);
  const [items, setItems] = useState(requests);

  const post = async (body: unknown) =>
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const resolve = async (id: string, outcome: 'upheld' | 'rejected') => {
    await post({ type: 'resolve-dispute', id, outcome });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: outcome } : r)));
  };

  const done = async (id: string) => {
    await post({ type: 'request-done', id });
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, done: true } : r)));
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <b className="text-sm">{t('reqDisputes', lang)}</b>
        {rows.length === 0 && <div className="card muted text-sm">{t('reqEmpty', lang)}</div>}
        {rows.map((row) => (
          <article key={row.id} className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="tag">{row.guideName}</span>
              <span className={row.status === 'refuted' ? 'tag tag-danger' : 'tag'}>
                {row.status}
              </span>
              <span className="muted ms-auto">{row.at}</span>
            </div>
            <p className="prose-measure text-sm">«{row.claim}»</p>
            <p className="muted prose-measure text-[13px]">{row.note}</p>
            {row.resolved ? (
              <span className={row.resolved === 'upheld' ? 'tag tag-ok self-start' : 'tag self-start'}>
                {t(row.resolved === 'upheld' ? 'reqUpheld' : 'reqRejected', lang)}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={() => resolve(row.id, 'upheld')}>
                  {t('reqUphold', lang)}
                </button>
                <button className="chip" onClick={() => resolve(row.id, 'rejected')}>
                  {t('reqReject', lang)}
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <b className="text-sm">{t('reqIncoming', lang)}</b>
        {items.length === 0 && <div className="card muted text-sm">{t('reqEmpty', lang)}</div>}
        {items.map((item) => (
          <article key={item.id} className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="tag tag-accent">
                {t(item.kind === 'place-problem' ? 'reqProblem' : 'reqBooking', lang)}
              </span>
              <span className="tag">{item.targetName}</span>
              <span className="muted ms-auto">{item.at}</span>
            </div>
            <p className="prose-measure text-sm">{item.message}</p>
            <div className="muted text-[13px]">{item.contact}</div>
            {item.done ? (
              <span className="tag tag-ok self-start">{t('reqDone', lang)}</span>
            ) : (
              <button className="chip self-start" onClick={() => done(item.id)}>
                {t('reqMarkDone', lang)}
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
