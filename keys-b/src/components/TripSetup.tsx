'use client';

import { StartFromLocation } from '@/components/StartFromLocation';
import { VoiceTrip } from '@/components/VoiceTrip';
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
import type { Interest, Pace } from '@/lib/types';

/**
 * Контекст поездки: регион, даты, интересы, формат, темп.
 *
 * Раньше эта форма стояла на главной, а поверх неё при первом входе падал
 * модальный опрос. Турист видел анкету раньше, чем продукт, и уходил, не поняв,
 * ради чего отвечает. Теперь главная показывает страну, а вопросы задаются
 * здесь — в момент, когда человек сам нажал «спланировать поездку»
 * и у вопроса появился смысл.
 */

const PACES: { pace: Pace; key: 'paceRelaxed' | 'paceNormal' | 'pacePacked' }[] = [
  { pace: 'relaxed', key: 'paceRelaxed' },
  { pace: 'normal', key: 'paceNormal' },
  { pace: 'packed', key: 'pacePacked' },
];

/** Верхняя граница поездки: одна и та же для дат и для ползунка, иначе они спорят. */
const MAX_DAYS = 14;

/** Число дней поездки из выбранных дат: обе даты включительно. */
export function daysBetween(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.min(MAX_DAYS, Math.round(ms / 86400000) + 1);
}

/**
 * Летняя жара определяется датой, а не галочкой: выбрал июль — правило включилось.
 * Галочка остаётся ручной поправкой для тех, кто планирует без дат.
 */
export function isSummer(date?: string): boolean | null {
  if (!date) return null;
  const month = Number(date.slice(5, 7));
  return month >= 6 && month <= 8;
}

export function TripSetup() {
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
      <VoiceTrip />

      <div>
        <div className="mb-2 text-sm font-semibold">
          {t('fieldRegion', lang)}{' '}
          <span className="muted font-normal">· {t('fieldRegionsHint', lang)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => {
            const active =
              region === 'all' ? trip.regions.length === 0 : trip.regions.includes(region);
            return (
              <button
                key={region}
                className="chip"
                data-active={active}
                onClick={() =>
                  update(
                    region === 'all'
                      ? { regions: [], region: 'all' }
                      : {
                          regions: trip.regions.includes(region)
                            ? trip.regions.filter((r) => r !== region)
                            : [...trip.regions, region],
                          region,
                        },
                  )
                }
              >
                {region === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[region], lang)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Откуда человек стартует. Раньше маршрут всегда начинался с Ташкента,
          и турист, прилетевший в Самарканд, первым делом получал переезд,
          которого не должно было быть. */}
      <div>
        <div className="mb-2 text-sm font-semibold">
          {t('fieldStartRegion', lang)}{' '}
          <span className="muted font-normal">· {t('fieldStartRegionHint', lang)}</span>
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {REGIONS.filter((region) => region !== 'all').map((region) => (
            <button
              key={region}
              className="chip"
              data-active={trip.startRegion === region}
              onClick={() =>
                update({ startRegion: trip.startRegion === region ? undefined : region })
              }
            >
              {tr(REGION_LABEL[region], lang)}
            </button>
          ))}
        </div>
        <StartFromLocation />
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">{t('fieldDates', lang)}</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="muted">{t('fieldDateFrom', lang)}</span>
          <input
            type="date"
            className="field max-w-44"
            value={trip.startDate ?? ''}
            onChange={(e) => {
              const startDate = e.target.value;
              update({
                startDate,
                days: daysBetween(startDate, trip.endDate) ?? trip.days,
                summer: isSummer(startDate) ?? trip.summer,
              });
            }}
          />
          <span className="muted">{t('fieldDateTo', lang)}</span>
          <input
            type="date"
            className="field max-w-44"
            min={trip.startDate}
            value={trip.endDate ?? ''}
            onChange={(e) => {
              const endDate = e.target.value;
              update({
                endDate,
                days: daysBetween(trip.startDate, endDate) ?? trip.days,
                summer: isSummer(trip.startDate) ?? trip.summer,
              });
            }}
          />
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

        <label className="flex cursor-pointer items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={trip.summer}
            onChange={(e) => update({ summer: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {t('fieldSummer', lang)}
        </label>

        <div>
          <div className="mb-2 text-sm font-semibold">
            {t('fieldPace', lang)}{' '}
            <span className="muted font-normal">· {t('paceHint', lang)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PACES.map(({ pace, key }) => (
              <button
                key={pace}
                className="chip"
                data-active={(trip.pace ?? 'normal') === pace}
                onClick={() => update({ pace })}
              >
                {t(key, lang)}
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
            max={MAX_DAYS}
            value={trip.days}
            onChange={(e) => update({ days: Number(e.target.value) })}
            className="w-48 accent-[var(--accent)]"
          />
        </div>
      </div>
    </div>
  );
}
