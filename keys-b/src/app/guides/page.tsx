'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { LANGUAGE_LABEL } from '@/data/guides';
import { REGION_LABEL } from '@/data/places';
import { INTEREST_LABEL } from '@/lib/labels';
import type { ScoredGuide } from '@/lib/types';

const LANGUAGES = ['any', 'ru', 'en', 'uz', 'fr', 'de', 'tr'];

export default function GuidesPage() {
  const { trip, ready } = useTrip();
  const [language, setLanguage] = useState('ru');
  const [guides, setGuides] = useState<ScoredGuide[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trip, language }),
      });
      const data = (await res.json()) as { guides: ScoredGuide[] };
      setGuides(data.guides);
    } finally {
      setLoading(false);
    }
  }, [trip, language]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">Подбор гида под ваш маршрут</h1>
        <p className="muted mt-1 text-sm">
          Учитываются регион, интересы и формат поездки из общего контекста. Метка
          «подтверждён» — демонстрационная.
        </p>
      </section>

      <section className="card flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">Язык гида</label>
        <select
          className="field max-w-48"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {code === 'any' ? 'любой' : LANGUAGE_LABEL[code]}
            </option>
          ))}
        </select>
        {loading && <span className="muted text-sm">Подбираю…</span>}
      </section>

      <section className="flex flex-col gap-3">
        {guides.length === 0 && !loading && (
          <div className="card muted text-sm">
            Под текущие фильтры гидов нет — измените язык или контекст поездки.
          </div>
        )}

        {guides.map(({ guide, why }) => (
          <article key={guide.id} className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">{guide.name}</span>
              {guide.verified && (
                <span className="tag" style={{ color: 'var(--ok)' }}>
                  ✓ подтверждён (демо)
                </span>
              )}
              <span className="tag">★ {guide.rating.toFixed(1)} · {guide.reviews} отзывов</span>
              <span className="tag">${guide.pricePerDay}/день</span>
              <span className="tag">{guide.experienceYears} лет опыта</span>
            </div>

            <p className="text-[13px]">{guide.bio}</p>

            <div className="muted text-[13px]">
              {guide.regions.map((r) => REGION_LABEL[r]).join(', ')} ·{' '}
              {guide.specializations.map((s) => INTEREST_LABEL[s]).join(', ')} ·{' '}
              {guide.languages.map((l) => LANGUAGE_LABEL[l]).join(', ')}
            </div>

            <div className="text-[13px]" style={{ color: 'var(--accent)' }}>
              Почему он: {why}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
