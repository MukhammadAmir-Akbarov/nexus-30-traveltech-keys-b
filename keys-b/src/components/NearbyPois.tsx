'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { POIS } from '@/data/poi';
import { FUEL_LABEL, POI_ICON, POI_KINDS, POI_LABEL, nearestPois } from '@/lib/poi';
import { distanceLabel } from '@/lib/route';
import { t, tr } from '@/lib/i18n';
import type { Place, PoiKind } from '@/lib/types';

// Из голосового отзыва: узбекистанцы ездят на своей машине, и по дороге нужны
// метан, туалет, намазхона, медпункт и кафе — одним действием и рядом.

export function NearbyPois({ place }: { place: Place }) {
  const { lang } = useTrip();
  const [kinds, setKinds] = useState<PoiKind[]>(POI_KINDS);
  const nearby = nearestPois(POIS, place, kinds);

  const toggle = (kind: PoiKind) =>
    setKinds((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  return (
    <details className="text-[13px]">
      <summary className="muted cursor-pointer">
        {t('nearbyTitle', lang)} · {t('nearbyHint', lang)}
      </summary>

      <div className="mt-2 flex flex-wrap gap-2">
        {POI_KINDS.map((kind) => (
          <button
            key={kind}
            className="chip"
            data-active={kinds.includes(kind)}
            onClick={() => toggle(kind)}
          >
            <Icon name={POI_ICON[kind]} size={15} />
            {tr(POI_LABEL[kind], lang)}
          </button>
        ))}
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {nearby.map(({ poi, km }) => (
          <li key={poi.id} className="flex flex-wrap items-center gap-2">
            <Icon name={POI_ICON[poi.kind]} size={15} />
            <span>{tr(poi.name, lang)}</span>
            {poi.fuel && <span className="tag">{tr(FUEL_LABEL[poi.fuel], lang)}</span>}
            {/* единицы из словаря: «км» кириллицей стояло и в узбекском,
                и в английском интерфейсе. Формат берём тот же, что в маршруте,
                чтобы «800 м» на карточке и в плане дня выглядели одинаково. */}
            <span className="muted">
              {distanceLabel(km).value}{' '}
              {t(distanceLabel(km).unit === 'm' ? 'legM' : 'legKm', lang)}
            </span>
          </li>
        ))}
        {nearby.length === 0 && <li className="muted">—</li>}
      </ul>
    </details>
  );
}
