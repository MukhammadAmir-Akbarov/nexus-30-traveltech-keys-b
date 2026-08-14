'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { GUIDE_LANG_LABEL, INTEREST_LABEL, REGION_LABEL, t, tr } from '@/lib/i18n';
import type { ScoredGuide } from '@/lib/types';

const LANGUAGES = ['any', 'ru', 'en', 'uz', 'fr', 'de', 'tr'];

export default function GuidesPage() {
  const { trip, lang, ready } = useTrip();
  const [guideLanguage, setGuideLanguage] = useState('ru');
  const [guides, setGuides] = useState<ScoredGuide[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trip, language: guideLanguage }),
      });
      const data = (await res.json()) as { guides: ScoredGuide[] };
      setGuides(data.guides);
    } finally {
      setLoading(false);
    }
  }, [trip, guideLanguage]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">{t('guidesTitle', lang)}</h1>
        <p className="muted mt-1 text-sm">{t('guidesLead', lang)}</p>
      </section>

      <section className="card flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">{t('guidesLanguage', lang)}</label>
        <select
          className="field max-w-48"
          value={guideLanguage}
          onChange={(e) => setGuideLanguage(e.target.value)}
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {tr(GUIDE_LANG_LABEL[code], lang)}
            </option>
          ))}
        </select>
        {loading && <span className="muted text-sm">{t('guidesLoading', lang)}</span>}
      </section>

      <section className="flex flex-col gap-3">
        {guides.length === 0 && !loading && (
          <div className="card muted text-sm">{t('guidesEmpty', lang)}</div>
        )}

        {guides.map(({ guide, why }) => (
          <article key={guide.id} className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">{guide.name}</span>
              {guide.verified && (
                <span className="tag" style={{ color: 'var(--ok)' }}>
                  {t('guidesVerified', lang)}
                </span>
              )}
              <span className="tag">
                ★ {guide.rating.toFixed(1)} · {guide.reviews} {t('guidesReviews', lang)}
              </span>
              <span className="tag">
                ${guide.pricePerDay} / {t('guidesPerDay', lang)}
              </span>
              <span className="tag">
                {guide.experienceYears} {t('guidesYears', lang)}
              </span>
            </div>

            <p className="text-[13px]">{tr(guide.bio, lang)}</p>

            <div className="muted text-[13px]">
              {guide.regions.map((r) => tr(REGION_LABEL[r], lang)).join(', ')} ·{' '}
              {guide.specializations.map((s) => tr(INTEREST_LABEL[s], lang)).join(', ')} ·{' '}
              {guide.languages.map((l) => tr(GUIDE_LANG_LABEL[l], lang)).join(', ')}
            </div>

            <div className="text-[13px]" style={{ color: 'var(--accent)' }}>
              {t('guidesWhy', lang)}: {why}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
