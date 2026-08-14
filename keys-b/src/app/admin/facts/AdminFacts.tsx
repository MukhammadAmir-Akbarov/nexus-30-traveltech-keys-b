'use client';

import { useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { t, tr } from '@/lib/i18n';
import type { I18nText } from '@/lib/types';

type Fact = { id: string; text: string; placeId: string | null; sourceUrl: string };
type PlaceOption = { id: string; name: I18nText };

export function AdminFacts({ initial, places }: { initial: Fact[]; places: PlaceOption[] }) {
  const { lang } = useTrip();
  const [facts, setFacts] = useState(initial);
  const [text, setText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'addFact', text, placeId, sourceTitle, sourceUrl }),
    });
    const data = (await res.json()) as { ok?: boolean; id?: string };
    if (data.ok && data.id) {
      setFacts((prev) => [...prev, { id: data.id!, text, placeId: placeId || null, sourceUrl }]);
      setText('');
      setSourceTitle('');
      setSourceUrl('');
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'removeFact', id }),
    });
    setFacts((prev) => prev.filter((fact) => fact.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="card flex flex-col gap-3" onSubmit={add}>
        <div className="text-sm font-semibold">{t('adminAddFact', lang)}</div>
        <textarea
          className="field min-h-20"
          placeholder={t('adminFactText', lang)}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <select
            className="field max-w-56"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            <option value="">{t('adminPlaceOptional', lang)}</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {tr(place.name, lang)}
              </option>
            ))}
          </select>
          <input
            className="field max-w-56"
            placeholder={t('adminSourceTitle', lang)}
            value={sourceTitle}
            onChange={(e) => setSourceTitle(e.target.value)}
          />
          <input
            className="field max-w-72"
            type="url"
            required
            placeholder={t('adminSourceUrl', lang)}
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <button className="btn btn-primary self-start" disabled={busy}>
          {t('adminAddFact', lang)}
        </button>
      </form>

      <section className="flex flex-col gap-2">
        {facts.map((fact) => (
          <article key={fact.id} className="card flex flex-col gap-1 text-[13px]">
            <div className="flex items-start gap-3">
              <p className="flex-1">{fact.text}</p>
              <button
                className="chip"
                style={{ color: 'var(--danger)' }}
                onClick={() => remove(fact.id)}
              >
                {t('adminDelete', lang)}
              </button>
            </div>
            <div className="muted text-[12px]">
              {fact.placeId ?? '—'} · {fact.sourceUrl}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
