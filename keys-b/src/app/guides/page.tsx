'use client';

import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import {
  GENDER_LABEL,
  GUIDE_LANGS,
  GUIDE_LANG_LABEL,
  INTEREST_LABEL,
  REGION_LABEL,
  REVIEW_TEMPLATE,
  reviewsLabel,
  yearsLabel,
  t,
  tr,
} from '@/lib/i18n';
import { PLACE_BY_ID } from '@/data/places';
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
        <h1>{t('guidesTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('guidesLead', lang)}</p>
        {/* ★ и точность фактов стоят в карточке рядом — без этой строки непонятно,
            чем они отличаются, а это и есть главная идея продукта */}
        <p className="muted prose-measure mt-2 text-[13px]">{t('guidesTwoScores', lang)}</p>
      </section>

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

        {guides.map(({ guide, why, accuracy, byPlace }) => (
          <article key={guide.id} className="card flex flex-col gap-3">
            <div className="flex gap-3">
              <Avatar name={guide.name} size={52} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold">{guide.name}</span>
                  {guide.verified && (
                    <span className="tag tag-ok">
                      <Icon name="shield" size={13} />
                      {t('guidesVerified', lang)}
                    </span>
                  )}
                  <span className="tag">
                    ★ {guide.rating.toFixed(1)} · {guide.reviews} {reviewsLabel(guide.reviews, lang)}
                  </span>
                  <span className="tag tag-accent">
                    ${guide.pricePerDay} / {t('guidesPerDay', lang)}
                  </span>
                  <span className="tag">
                    {guide.experienceYears} {yearsLabel(guide.experienceYears, lang)}
                  </span>
                  {guide.hasTransport && (
                    <span className="tag">
                      <Icon name="car" size={13} />
                      {t('guidesTransport', lang)}
                    </span>
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
              <div className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="muted">{t('guidesAccuracy', lang)}</span>
                  <b>
                    {Math.round((accuracy.confirmed / (accuracy.confirmed + accuracy.refuted)) * 100)}%
                  </b>
                </div>
                <div
                  className="meter"
                  role="img"
                  aria-label={t('guidesAccuracy', lang)}
                >
                  <span
                    style={{
                      width: `${(accuracy.confirmed / (accuracy.confirmed + accuracy.refuted)) * 100}%`,
                    }}
                  />
                </div>
                <span className="muted text-[12px]">
                  {t('guidesAccuracyHint', lang)} · {accuracy.confirmed + accuracy.refuted}
                </span>
              </div>
            )}

            {byPlace && Object.keys(byPlace).length > 0 && (
              <div className="flex flex-col gap-1 text-[13px]">
                <span className="muted">{t('guidesByPlace', lang)}</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(byPlace).map(([placeId, stats]) => {
                    const decided = stats.confirmed + stats.refuted;
                    if (decided === 0) return null;
                    const percent = Math.round((stats.confirmed / decided) * 100);
                    const place = PLACE_BY_ID[placeId];
                    return (
                      <span
                        key={placeId}
                        className={percent >= 70 ? 'tag tag-ok' : 'tag tag-danger'}
                      >
                        {place ? tr(place.name, lang) : placeId}: {percent}%
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Восемь причин через точку читались как лог. Показываем три главные,
                остальные — под раскрытием: порядок в match.ts уже по важности. */}
            {(() => {
              const reasons = why.split(' · ');
              const top = reasons.slice(0, 3);
              const rest = reasons.slice(3);
              return (
                <div className="text-[13px]" style={{ color: 'var(--accent)' }}>
                  {t('guidesWhy', lang)}: {top.join(' · ')}
                  {rest.length > 0 && (
                    <details className="mt-1">
                      <summary className="muted cursor-pointer">
                        {t('guidesWhyMore', lang)} ({rest.length})
                      </summary>
                      <span className="muted">{rest.join(' · ')}</span>
                    </details>
                  )}
                </div>
              );
            })()}

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
