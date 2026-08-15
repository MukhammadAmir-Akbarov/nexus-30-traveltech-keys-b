'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { MIN_CHECKS } from '@/lib/match';
import { t, tr } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';
import type { FactRecord, GuideAccuracy, GuideAccuracyByPlace, I18nText } from '@/lib/types';

type Row = FactRecord & { placeName: I18nText | null };

const STATUS_UI: Record<FactRecord['status'], { cls: string; key: UiKey }> = {
  confirmed: { cls: 'tag tag-ok', key: 'statusConfirmed' },
  refuted: { cls: 'tag tag-danger', key: 'statusRefuted' },
  unclear: { cls: 'tag tag-warn', key: 'statusUnclear' },
};

export function GuidePanel({
  name,
  email,
  accuracy,
  byPlace,
  verdicts,
}: {
  name: string;
  email: string;
  accuracy: GuideAccuracy;
  byPlace: GuideAccuracyByPlace;
  verdicts: Row[];
}) {
  const { lang } = useTrip();
  const router = useRouter();
  const [rows, setRows] = useState(verdicts);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const decided = accuracy.confirmed + accuracy.refuted;
  const percent = decided ? Math.round((accuracy.confirmed / decided) * 100) : null;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const dispute = async (id: string) => {
    const res = await fetch('/api/guide/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdictId: id, note }),
    });
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, dispute: { note, at: '—' } } : r)),
      );
      setOpenId(null);
      setNote('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold">{t('guidePanelTitle', lang)}</h1>
        <span className="tag">{name}</span>
        <span className="muted ms-auto text-[13px]">{email}</span>
        <button className="chip" onClick={logout}>
          {t('authLogout', lang)}
        </button>
      </section>

      <section className="card flex flex-col gap-2">
        {decided < MIN_CHECKS ? (
          <>
            <span className="tag tag-warn self-start">
              <Icon name="alert" size={13} />
              {t('guidesFewChecks', lang)} · {decided}
            </span>
            <p className="muted prose-measure text-[13px]">{t('guidePanelFewHint', lang)}</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="muted">{t('guidesAccuracy', lang)}</span>
              <b className="text-lg">{percent}%</b>
            </div>
            <div className="meter" role="img" aria-label={`${t('guidesAccuracy', lang)}: ${percent}%`}>
              <span style={{ width: `${percent}%` }} />
            </div>
            <span className="muted text-[12px]">
              {t('guidesAccuracyHint', lang)} · {decided}
            </span>
          </>
        )}
      </section>

      {Object.keys(byPlace).length > 0 && (
        <section className="card flex flex-col gap-2">
          <b className="text-sm">{t('guidesByPlace', lang)}</b>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byPlace).map(([placeId, stats]) => {
              const total = stats.confirmed + stats.refuted;
              if (total < 3) return null;
              const share = Math.round((stats.confirmed / total) * 100);
              return (
                <span key={placeId} className={share >= 70 ? 'tag tag-ok' : 'tag tag-danger'}>
                  {placeId}: {share}%
                </span>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <b className="text-sm">{t('guidePanelVerdicts', lang)}</b>
        {rows.length === 0 && <div className="card muted text-sm">{t('guidePanelEmpty', lang)}</div>}

        {rows.map((row) => (
          <article key={row.id} className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className={STATUS_UI[row.status].cls}>
                {t(STATUS_UI[row.status].key, lang)}
              </span>
              {row.placeName && <span className="tag">{tr(row.placeName, lang)}</span>}
              <span className="muted ms-auto">{row.at}</span>
            </div>
            <p className="prose-measure text-sm">«{row.claim}»</p>

            {row.dispute ? (
              <div className="text-[13px]">
                <span className="tag tag-accent">{t('guidePanelDisputed', lang)}</span>
                <p className="muted mt-1">{row.dispute.note}</p>
              </div>
            ) : openId === row.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="field min-h-20 text-[13px]"
                  placeholder={t('guidePanelDisputePlaceholder', lang)}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary"
                    disabled={note.trim().length < 5}
                    onClick={() => dispute(row.id)}
                  >
                    {t('guidePanelDisputeSend', lang)}
                  </button>
                  <button className="chip" onClick={() => setOpenId(null)}>
                    {t('onbSkip', lang)}
                  </button>
                </div>
              </div>
            ) : (
              <button className="chip self-start" onClick={() => setOpenId(row.id)}>
                {t('guidePanelDispute', lang)}
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
