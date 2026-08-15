'use client';

import { useState } from 'react';
import { useTrip } from './TripProvider';
import {
  INTEREST_LABEL,
  INTERESTS,
  LANGS,
  LANG_LABEL,
  REGIONS,
  REGION_LABEL,
  TRAVEL_TYPES,
  TRAVEL_TYPE_LABEL,
  t,
  tr,
} from '@/lib/i18n';
import type { Interest } from '@/lib/types';

// Отзыв (запись 6): «unga qisqa gina savol berilsin: nimalarga qiziqasiz» —
// при первом входе задаём три коротких вопроса, а не длинную анкету.
// Показывается один раз: дальше контекст правится на главном экране.

export function Onboarding() {
  const { trip, lang, update, onboarded, finishOnboarding } = useTrip();
  const [step, setStep] = useState(0);

  if (onboarded) return null;

  const toggleInterest = (interest: Interest) =>
    update({
      interests: trip.interests.includes(interest)
        ? trip.interests.filter((i) => i !== interest)
        : [...trip.interests, interest],
    });

  const steps = [
    {
      // Язык — первым: подложка опроса перекрывает шапку с переключателем,
      // и без этого шага иностранец заперт в узбекском интерфейсе.
      title: t('onbLang', lang),
      body: (
        <div className="flex flex-wrap gap-2">
          {LANGS.map((code) => (
            <button
              key={code}
              className="chip"
              style={{ minHeight: 48, paddingInline: 18 }}
              data-active={lang === code}
              onClick={() => update({ lang: code })}
            >
              {LANG_LABEL[code]}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: t('onbInterests', lang),
      body: (
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              className="chip"
              data-active={trip.interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {tr(INTEREST_LABEL[interest], lang)}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: t('onbRegion', lang),
      body: (
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <button
              key={region}
              className="chip"
              data-active={
                region === 'all' ? trip.regions.length === 0 : trip.regions.includes(region)
              }
              // Пишем оба поля: планировщик читает regions, и если обновить
              // только region, ответ на первый же вопрос молча пропадает.
              onClick={() =>
                update(
                  region === 'all'
                    ? { region: 'all', regions: [] }
                    : { region, regions: [region] },
                )
              }
            >
              {region === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[region], lang)}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: t('onbFormat', lang),
      body: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {TRAVEL_TYPES.map((type) => (
              <button
                key={type}
                className="chip"
                data-active={trip.travelType === type}
                onClick={() => update({ travelType: type })}
              >
                {tr(TRAVEL_TYPE_LABEL[type], lang)}
              </button>
            ))}
          </div>
          <div>
            <div className="mb-2 text-sm">
              {t('fieldDays', lang)}: {trip.days}
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={trip.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div className="card w-full max-w-md">
        <div className="muted mb-1 text-[12px]">
          {step + 1} / {steps.length}
        </div>
        <h2 className="mb-3 text-base font-bold">{steps[step].title}</h2>
        {steps[step].body}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button className="chip" onClick={finishOnboarding}>
            {t('onbSkip', lang)}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => (isLast ? finishOnboarding() : setStep(step + 1))}
          >
            {isLast ? t('onbFinish', lang) : t('onbNext', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
