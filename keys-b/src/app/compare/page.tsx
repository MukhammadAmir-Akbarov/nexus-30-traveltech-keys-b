'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { PLACES, PLACE_BY_ID } from '@/data/places';
import { buildItinerary } from '@/lib/planner';
import { TRAVEL_TYPES, TRAVEL_TYPE_LABEL, t, tr } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';
import type { TravelType } from '@/lib/types';

// Доказательство персонализации за десять секунд: одни и те же интересы, регион
// и даты — три разных маршрута рядом. Пока это было спрятано в переключателе
// формата, разницу приходилось объяснять словами; здесь она видна глазами.
// Считается на клиенте: планировщик чистый, сеть для этого не нужна.

const REASON: Record<TravelType, UiKey> = {
  solo: 'compareWhySolo',
  couple: 'compareWhyCouple',
  family: 'compareWhyFamily',
  group: 'compareWhyGroup',
};

export default function ComparePage() {
  const { trip, lang, update } = useTrip();
  const router = useRouter();

  const columns = useMemo(
    () =>
      TRAVEL_TYPES.map((type) => {
        const itinerary = buildItinerary(PLACES, { ...trip, travelType: type });
        const ids = itinerary.days.flatMap((d) => d.items.map((i) => i.placeId));
        return { type, itinerary, ids };
      }),
    [trip],
  );

  // объект «общий», если он есть во всех трёх вариантах — такие приглушаем,
  // чтобы в глаза бросалось именно различие
  const shared = useMemo(() => {
    const [first, ...rest] = columns;
    return new Set(first.ids.filter((id) => rest.every((c) => c.ids.includes(id))));
  }, [columns]);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1>{t('compareTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">
          {t('compareLead', lang)}{' '}
          <Link href="/" className="underline" style={{ color: 'var(--accent-ink)' }}>
            {t('planChange', lang)}
          </Link>
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {columns.map(({ type, itinerary, ids }) => {
          const unique = ids.filter((id) => !shared.has(id)).length;
          return (
            <div key={type} className="card flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[15px]">{tr(TRAVEL_TYPE_LABEL[type], lang)}</b>
                {trip.travelType === type && (
                  <span className="tag tag-accent">{t('compareCurrent', lang)}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-[12px]">
                <span className="tag">
                  {itinerary.days.length} {t('daysShort', lang)}
                </span>
                <span className="tag">{ids.length} ×</span>
                {itinerary.cost && <span className="tag">≈ ${itinerary.cost.totalUsd}</span>}
                {unique > 0 && <span className="tag tag-ok">+{unique}</span>}
              </div>

              <ol className="flex flex-col gap-1 text-[13px]">
                {ids.map((id) => {
                  const place = PLACE_BY_ID[id];
                  if (!place) return null;
                  const isShared = shared.has(id);
                  return (
                    <li
                      key={id}
                      className="flex gap-2"
                      // общее приглушено, различие — обычным цветом и с точкой
                      style={{ color: isShared ? 'var(--muted)' : 'var(--text)' }}
                    >
                      <span style={{ color: isShared ? 'var(--border-strong)' : 'var(--accent)' }}>
                        {isShared ? '·' : '•'}
                      </span>
                      <span>{tr(place.name, lang)}</span>
                    </li>
                  );
                })}
              </ol>

              <p className="muted prose-measure text-[12px]">{t(REASON[type], lang)}</p>

              <button
                className="btn mt-auto"
                onClick={() => {
                  // формат кладём в общий контекст: /plan соберёт уже выбранный
                  update({ travelType: type });
                  router.push('/plan');
                }}
              >
                <Icon name="route" size={15} />
                {t('compareTake', lang)}
              </button>
            </div>
          );
        })}
      </section>

      <p className="muted prose-measure text-[13px]">{t('compareNote', lang)}</p>
    </div>
  );
}
