'use client';

import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { RequestForm } from '@/components/RequestForm';
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
import { MIN_CHECKS } from '@/lib/match';
import { dailyCapUsd, usdToUzsLabel } from '@/lib/budget';
import { PLACE_BY_ID } from '@/data/places';
import type { Gender, ScoredGuide, TripContext } from '@/lib/types';

const GENDERS: (Gender | 'any')[] = ['any', 'female', 'male'];

/** Порядок выдачи. `match` — как посчитал подбор, остальное задаёт турист. */
type Sort = 'match' | 'accuracy' | 'price' | 'experience';
const SORTS: { key: Sort; label: 'sortMatch' | 'sortAccuracy' | 'sortPrice' | 'sortExperience' }[] = [
  { key: 'match', label: 'sortMatch' },
  { key: 'accuracy', label: 'sortAccuracy' },
  { key: 'price', label: 'sortPrice' },
  { key: 'experience', label: 'sortExperience' },
];

/** Строку ищут первой: по имени, городу, языку и специализации сразу. */
const normalize = (value: string) => value.toLowerCase().replace(/ʻ|'|‘|’/g, '');

export default function GuidesPage() {
  const { trip, lang, ready, update } = useTrip();
  // Языки общения — часть контекста поездки, а не настройка этой страницы:
  // раньше здесь всегда стоял русский, каким бы ни был интерфейс и кто бы
  // ни искал гида. Пока турист не выбрал — берём язык интерфейса.
  const languages: string[] = trip.guideLangs?.length ? trip.guideLangs : [lang];
  const setLanguages = (next: string[]) =>
    update({ guideLangs: (next.length ? next : [lang]) as TripContext['guideLangs'] });
  const [gender, setGender] = useState<Gender | 'any'>('any');
  const [needTransport, setNeedTransport] = useState(false);
  const [guides, setGuides] = useState<ScoredGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('match');
  // Бюджет турист уже назвал на главной, и цена гида относительно него —
  // важная информация. Но фильтровать по нему **по умолчанию нельзя**:
  // у «Tejamkor» дневной потолок $24, а гиды стоят $55–70, и раздел
  // становится пустым — выглядит как сломанный, а не как честный.
  // Поэтому по умолчанию показываем всех и помечаем тех, кто дороже.
  const [withinBudget, setWithinBudget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...trip,
          languages: trip.guideLangs?.length ? trip.guideLangs : [lang],
          gender,
          needTransport,
          // весь подходящий список: поиск и сортировка идут на клиенте
          limit: 50,
        }),
      });
      const data = (await res.json()) as { guides: ScoredGuide[] };
      setGuides(data.guides);
    } finally {
      setLoading(false);
    }
    // languages выведены из trip, который уже в зависимостях
  }, [trip, lang, gender, needTransport]);

  // Загрузка списка — сетевой запрос: setState происходит после await, но
  // правило видит вызов внутри эффекта. Другого места у запроса нет.
  useEffect(() => {
    // сетевой запрос: setState случается после await, но правило видит вызов
    // внутри эффекта. Другого места у загрузки списка нет.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) load();
  }, [ready, load]);

  // Потолок цены гида берём из дневного бюджета поездки. Бюджет не выбран —
  // ограничения нет: выдумывать за туриста нельзя.
  const priceCap = trip.budget ? dailyCapUsd(trip.budget) : Infinity;

  const shown = (() => {
    const needle = normalize(query.trim());
    let list = guides;
    if (needle) {
      list = list.filter(({ guide }) =>
        normalize(
          [
            guide.name,
            ...guide.regions.map((r) => tr(REGION_LABEL[r], lang)),
            ...guide.languages.map((l) => tr(GUIDE_LANG_LABEL[l], lang)),
            ...guide.specializations.map((sp) => tr(INTEREST_LABEL[sp], lang)),
          ].join(' '),
        ).includes(needle),
      );
    }
    if (withinBudget && Number.isFinite(priceCap)) {
      list = list.filter(({ guide }) => guide.pricePerDay <= priceCap);
    }
    const byAccuracy = (g: ScoredGuide) => {
      const a = g.accuracy;
      const decided = a ? a.confirmed + a.refuted : 0;
      // до порога процент не показываем и здесь не сортируем по нему
      return decided >= MIN_CHECKS ? (a!.confirmed / decided) * 100 : -1;
    };
    const sorted = [...list];
    if (sort === 'accuracy') sorted.sort((a, b) => byAccuracy(b) - byAccuracy(a));
    if (sort === 'price') sorted.sort((a, b) => a.guide.pricePerDay - b.guide.pricePerDay);
    if (sort === 'experience')
      sorted.sort((a, b) => b.guide.experienceYears - a.guide.experienceYears);
    return sorted;
  })();

  const verifiedCount = shown.filter(({ guide }) => guide.verified).length;
  const aboveBudget = Number.isFinite(priceCap)
    ? guides.filter(({ guide }) => guide.pricePerDay > priceCap).length
    : 0;

  const toggleLanguage = (code: string) =>
    setLanguages(
      languages.includes(code) ? languages.filter((l) => l !== code) : [...languages, code],
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

        {/* Строку ищут первой: имя, город, язык и специализация сразу. */}
        <input
          className="field"
          type="search"
          placeholder={t('guidesSearch', lang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('guidesSearch', lang)}
        />

        <div>
          <div className="mb-2 text-sm font-semibold">{t('guidesSort', lang)}</div>
          <div className="flex flex-wrap gap-2">
            {SORTS.map(({ key, label }) => (
              <button
                key={key}
                className="chip"
                data-active={sort === key}
                onClick={() => setSort(key)}
              >
                {t(label, lang)}
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

          {/* Бюджет турист уже назвал — гид за пределами этого бюджета
              бессмыслен, но запрещать его мы не вправе. */}
          {trip.budget && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withinBudget}
                onChange={(e) => setWithinBudget(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {t('guidesWithinBudget', lang)}
              <span className="muted">· ≤ ${priceCap}</span>
            </label>
          )}

          {loading && <span className="muted text-sm">{t('guidesLoading', lang)}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {/* Сколько нашлось и сколько из них подтверждено: подтверждённость —
            главное отличие продукта, и она должна быть видна до карточек. */}
        {!loading && shown.length > 0 && (
          <div className="muted text-[13px]">
            {t('guidesFound', lang)}: <b>{shown.length}</b> ·{' '}
            {t('guidesVerifiedCount', lang)}: {verifiedCount}
            {aboveBudget > 0 && (
              <>
                {' · '}
                <button className="underline" onClick={() => setWithinBudget(!withinBudget)}>
                  {t('guidesAboveBudget', lang)}: {aboveBudget}
                </button>
              </>
            )}
          </div>
        )}

        {shown.length === 0 && !loading && (
          <div className="card flex flex-col gap-2 text-sm">
            <span className="muted">{t('guidesEmpty', lang)}</span>
            {/* Пустой список обязан сказать, что именно снять — иначе человек
                упирается и уходит, решив, что гидов нет вовсе. */}
            <div className="flex flex-wrap gap-2">
              {query && (
                <button className="chip" onClick={() => setQuery('')}>
                  {t('guidesClearSearch', lang)}
                </button>
              )}
              {withinBudget && (
                <button className="chip" onClick={() => setWithinBudget(false)}>
                  {t('guidesHiddenByBudget', lang)}: {aboveBudget}
                </button>
              )}
              {needTransport && (
                <button className="chip" onClick={() => setNeedTransport(false)}>
                  {t('guidesClearTransport', lang)}
                </button>
              )}
            </div>
          </div>
        )}

        {shown.map(({ guide, why, accuracy, byPlace }) => (
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
                    <span className="muted">· {usdToUzsLabel(guide.pricePerDay, lang)}</span>
                  </span>
                  {/* Дороже названного бюджета — сказать, но не прятать:
                      выбор всё равно за туристом. */}
                  {guide.pricePerDay > priceCap && (
                    <span className="tag tag-warn">{t('guidesAboveBudget', lang)}</span>
                  )}
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

            {accuracy &&
              accuracy.confirmed + accuracy.refuted > 0 &&
              (() => {
                const decided = accuracy.confirmed + accuracy.refuted;
                // до порога процент не показываем вовсе: «100% по одной проверке»
                // выглядит убедительнее, чем «95% по двадцати двум», и это ложь
                if (decided < MIN_CHECKS) {
                  return (
                    <div className="text-[13px]">
                      <span className="tag tag-warn">
                        <Icon name="alert" size={13} />
                        {t('guidesFewChecks', lang)} · {decided}
                      </span>
                    </div>
                  );
                }
                const percent = Math.round((accuracy.confirmed / decided) * 100);
                return (
                  <div className="flex flex-col gap-1.5 text-[13px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="muted">{t('guidesAccuracy', lang)}</span>
                      <b>{percent}%</b>
                    </div>
                    <div className="meter" role="img" aria-label={`${t('guidesAccuracy', lang)}: ${percent}%`}>
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <span className="muted text-[12px]">
                      {t('guidesAccuracyHint', lang)} · {decided}
                    </span>
                  </div>
                );
              })()}

            {byPlace && Object.keys(byPlace).length > 0 && (
              <div className="flex flex-col gap-1 text-[13px]">
                <span className="muted">{t('guidesByPlace', lang)}</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(byPlace).map(([placeId, stats]) => {
                    const decided = stats.confirmed + stats.refuted;
                    // тот же принцип, что и с общей точностью, только порог ниже
                    if (decided < 3) return null;
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
                      <summary>
                        {t('guidesWhyMore', lang)} ({rest.length})
                      </summary>
                      <span className="muted">{rest.join(' · ')}</span>
                    </details>
                  )}
                </div>
              );
            })()}

            <details className="text-[13px]">
              <summary>{t('verifyTitle', lang)}</summary>
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

            {/* найти гида было можно, а позвать — нет; заявка замыкает сценарий */}
            <div className="flex flex-wrap items-start gap-2">
              <RequestForm kind="guide-booking" targetId={guide.id} />
            </div>

            <details className="text-[13px]">
              <summary>
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
