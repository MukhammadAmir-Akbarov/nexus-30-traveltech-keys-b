'use client';

import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { useTrip } from '@/components/TripProvider';
import { GENDER_LABEL, GUIDE_LANG_LABEL, t, tr } from '@/lib/i18n';

type Row = {
  id: string;
  name: string;
  gender: 'female' | 'male';
  hasTransport: boolean;
  languages: string[];
  rating: number;
  verified: boolean;
};

export function AdminGuides({ initial }: { initial: Row[] }) {
  const { lang } = useTrip();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (body: object) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<{ ok?: boolean; verified?: boolean; email?: string; password?: string }>;
  };

  // Доступ гида к своей карточке: логин и пароль отдаёт администратор.
  // Пароль показывается один раз — второй раз его взять неоткуда.
  const [access, setAccess] = useState<Record<string, string>>({});
  const grantAccess = async (id: string) => {
    setBusy(id);
    const data = await call({ type: 'guideAccount', id });
    if (data.email && data.password) {
      setAccess((prev) => ({ ...prev, [id]: `${data.email} / ${data.password}` }));
    }
    setBusy(null);
  };

  const toggle = async (id: string) => {
    setBusy(id);
    const data = await call({ type: 'toggleGuide', id });
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, verified: data.verified ?? row.verified } : row)),
    );
    setBusy(null);
  };

  const remove = async (id: string) => {
    setBusy(id);
    const data = await call({ type: 'removeGuide', id });
    if (data.ok) setRows((prev) => prev.filter((row) => row.id !== id));
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <article key={row.id} className="card flex flex-wrap items-center gap-3">
          <Avatar name={row.name} size={40} />
          <div className="flex flex-col">
            <span className="text-sm font-bold">{row.name}</span>
            <span className="muted text-[12px]">
              ★ {row.rating.toFixed(1)} · {tr(GENDER_LABEL[row.gender], lang)} ·{' '}
              {row.languages.map((l) => tr(GUIDE_LANG_LABEL[l], lang)).join(', ')}
              {row.hasTransport ? ` · ${t('guidesHasTransport', lang)}` : ''}
            </span>
          </div>

          <span className="tag ms-auto" style={{ color: row.verified ? 'var(--ok)' : 'var(--muted)' }}>
            {row.verified ? '✓' : '—'}
          </span>
          <button className="chip" disabled={busy === row.id} onClick={() => toggle(row.id)}>
            {row.verified ? t('adminVerifyOff', lang) : t('adminVerifyOn', lang)}
          </button>
          <button className="chip" disabled={busy === row.id} onClick={() => grantAccess(row.id)}>
            {t('adminGuideAccess', lang)}
          </button>
          <button
            className="chip"
            disabled={busy === row.id}
            style={{ color: 'var(--danger)' }}
            onClick={() => remove(row.id)}
          >
            {t('adminDelete', lang)}
          </button>

          {access[row.id] && (
            <div className="w-full text-[12px]">
              <span className="muted">{t('adminGuideAccessDone', lang)} </span>
              <code>{access[row.id]}</code>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
