'use client';

import Link from 'next/link';
import { useTrip } from '@/components/TripProvider';
import {
  INTEREST_LABEL,
  INTERESTS,
  REGIONS,
  REGION_LABEL,
  TRAVEL_TYPES,
  TRAVEL_TYPE_LABEL,
  t,
  tr,
} from '@/lib/i18n';
import type { Interest } from '@/lib/types';

export default function Home() {
  const { trip, lang, update } = useTrip();

  const toggleInterest = (interest: Interest) => {
    const has = trip.interests.includes(interest);
    update({
      interests: has
        ? trip.interests.filter((i) => i !== interest)
        : [...trip.interests, interest],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1 className="text-2xl font-bold">{t('homeTitle', lang)}</h1>
        <p className="muted mt-1 max-w-2xl text-sm">{t('homeLead', lang)}</p>
      </section>

      <section className="card flex flex-col gap-5">
        <div>
          <div className="mb-2 text-sm font-semibold">{t('fieldRegion', lang)}</div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                className="chip"
                data-active={trip.region === region}
                onClick={() => update({ region })}
              >
                {region === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[region], lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">{t('fieldInterests', lang)}</div>
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
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">{t('fieldTravelType', lang)}</div>
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
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">
              {t('fieldDays', lang)}: {trip.days}
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={trip.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="w-48 accent-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/check" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">{t('cardCheckTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardCheckText', lang)}</p>
        </Link>
        <Link href="/plan" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">{t('cardPlanTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardPlanText', lang)}</p>
        </Link>
        <Link href="/guides" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">{t('cardGuidesTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardGuidesText', lang)}</p>
        </Link>
      </section>
    </div>
  );
}
