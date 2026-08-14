'use client';

import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { SoloPanel } from '@/components/SoloPanel';
import { useTrip } from '@/components/TripProvider';
import {
  GENDER_LABEL,
  GUIDE_LANGS,
  GUIDE_LANG_LABEL,
  INTEREST_LABEL,
  REGION_LABEL,
  REVIEW_TEMPLATE,
  t,
  tr,
} from '@/lib/i18n';
import type { Gender, ScoredGuide } from '@/lib/types';

const GENDERS: (Gender | 'any')[] = ['any', 'female', 'male'];

export default function GuidesPage() {
  const { trip, lang, ready } = useTrip();
  const [languages, setLanguages] = useState<string[]>(['ru']);
  const [gender, setGender] = useState<Gender | 'any'>('any');
  const [needTransport, setNeedTransport] = useState(false);
  const [guides, setGuides] = useState<ScoredGuide[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trip, languages, gender, needTransport }),
      });
      const data = (await res.json()) as { guides: ScoredGuide[] };
      setGuides(data.guides);
    } finally {
      setLoading(false);
    }
  }, [trip, languages, gender, needTransport]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const toggleLanguage = (code: string) =>
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">{t('guidesTitle', lang)}</h1>
        <p className="muted mt-1 text-sm">{t('guidesLead', lang)}</p>
      </section>

      <SoloPanel />

      <section className="card flex flex-col gap-4">
        <div>
          <div className="mb-2 text-sm font-semibold">
            {t('guidesLanguage', lang)}{' '}
            <span className="muted font-normal">· {t('guidesLanguageHint', lang)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GUIDE_LANGS.map((code) => (
              <button
                key={code}
                className="chip"
                data-active={languages.includes(code)}
                onClick={() => toggleLanguage(code)}
              >
                {tr(GUIDE_LANG_LABEL[code], lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">{t('guidesGender', lang)}</div>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((value) => (
                <button
                  key={value}
                  className="chip"
                  data-active={gender === value}
                  onClick={() => setGender(value)}
                >
                  {tr(GENDER_LABEL[value], lang)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={needTransport}
              onChange={(e) => setNeedTransport(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t('guidesTransport', lang)}
          </label>

          {loading && <span className="muted text-sm">{t('guidesLoading', lang)}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {guides.length === 0 && !loading && (
          <div className="card muted text-sm">{t('guidesEmpty', lang)}</div>
        )}

        {guides.map(({ guide, why, accuracy }) => (
          <article key={guide.id} className="card flex flex-col gap-3">
            <div className="flex gap-3">
              <Avatar name={guide.name} />
              <div className="flex flex-col gap-1">
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
                  {guide.hasTransport && (
                    <span className="tag">{t('guidesHasTransport', lang)}</span>
                  )}
                </div>
                <p className="text-[13px]">{tr(guide.bio, lang)}</p>
                <div className="muted text-[13px]">
                  {guide.regions.map((r) => tr(REGION_LABEL[r], lang)).join(', ')} ·{' '}
                  {guide.specializations.map((s) => tr(INTEREST_LABEL[s], lang)).join(', ')} ·{' '}
                  {guide.languages.map((l) => tr(GUIDE_LANG_LABEL[l], lang)).join(', ')}
                </div>
              </div>
            </div>

            {accuracy && accuracy.confirmed + accuracy.refuted > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="tag" style={{ color: 'var(--ok)' }}>
                  {t('guidesAccuracy', lang)}:{' '}
                  {Math.round(
                    (accuracy.confirmed / (accuracy.confirmed + accuracy.refuted)) * 100,
                  )}
                  %
                </span>
                <span className="muted text-[12px]">
                  {t('guidesAccuracyHint', lang)} · {accuracy.confirmed + accuracy.refuted}
                </span>
              </div>
            )}

            <div className="text-[13px]" style={{ color: 'var(--accent)' }}>
              {t('guidesWhy', lang)}: {why}
            </div>

            <details className="text-[13px]">
              <summary className="muted cursor-pointer">{t('verifyTitle', lang)}</summary>
              {guide.verification.registry ? (
                <ul className="mt-2 flex flex-col gap-1">
                  <li>
                    {t('verifyLicense', lang)}: <b>{guide.verification.license}</b>
                  </li>
                  <li>✓ {t('verifyRegistry', lang)}</li>
                  <li>✓ {t('verifyIdentity', lang)}</li>
                  <li>✓ {t('verifyLanguages', lang)}</li>
                  <li className="muted">
                    {t('verifyDate', lang)}: {guide.verification.checkedAt}
                  </li>
                  <li className="muted text-[12px]">{t('verifyDemoNote', lang)}</li>
                </ul>
              ) : (
                <p className="mt-2" style={{ color: 'var(--danger)' }}>
                  {t('verifyNone', lang)}
                </p>
              )}
            </details>

            <details className="text-[13px]">
              <summary className="muted cursor-pointer">
                {t('guidesReviewsTitle', lang)} ({guide.reviewsList.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {guide.reviewsList.map((review) => (
                  <li key={review.author} className="flex flex-col">
                    <span className="font-semibold">
                      {review.author} · {'★'.repeat(review.rating)}
                    </span>
                    <span className="muted">{tr(REVIEW_TEMPLATE[review.templateId], lang)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
