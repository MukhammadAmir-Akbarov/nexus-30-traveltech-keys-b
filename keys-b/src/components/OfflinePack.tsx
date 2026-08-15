'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { PLACES } from '@/data/places';
import { REGION_CENTER } from '@/data/climate';
import { t } from '@/lib/i18n';
import { selectedRegions } from '@/lib/planner';

// Офлайн-пакет региона: явно прогреть карту, пока сеть есть.
//
// Сервис-воркер и так кэширует тайлы по мере просмотра, но турист узнаёт об
// этом в момент, когда сети уже нет. Кнопка переворачивает логику: скачать
// заранее, осознанно, с видимым прогрессом.

/** Тайлы вокруг точки на нужных зумах: город целиком и подходы к объектам. */
function tileUrls(lat: number, lng: number, zooms = [11, 12, 13, 14]): string[] {
  const urls: string[] = [];
  for (const z of zooms) {
    const n = 2 ** z;
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
    );
    // берём квадрат 3×3 вокруг центральной клетки — этого хватает на город
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        urls.push(`https://tile.openstreetmap.org/${z}/${x + dx}/${y + dy}.png`);
      }
    }
  }
  return urls;
}

export function OfflinePack() {
  const { trip, lang } = useTrip();
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const regions = selectedRegions(trip);
      const targets = regions.length
        ? regions
        : [...new Set(PLACES.map((p) => p.region))];

      const urls = targets.flatMap((region) => {
        const center = REGION_CENTER[region];
        return tileUrls(center.lat, center.lng);
      });
      setTotal(urls.length);
      setDone(0);

      // грузим пачками: сотня одновременных запросов к тайлам никому не нужна
      const BATCH = 12;
      for (let i = 0; i < urls.length; i += BATCH) {
        await Promise.all(
          urls.slice(i, i + BATCH).map((url) =>
            // сам запрос кладёт тайл в кэш — это делает сервис-воркер
            fetch(url, { mode: 'no-cors' }).catch(() => undefined),
          ),
        );
        setDone(Math.min(i + BATCH, urls.length));
      }

      // и сам маршрут, чтобы страница открылась без сети
      await fetch('/plan').catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="card flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn" disabled={busy} onClick={download}>
          <Icon name="pin" />
          {busy ? t('offlinePackBusy', lang) : t('offlinePack', lang)}
        </button>
        {total > 0 && (
          <span className="tag" aria-live="polite">
            {percent}%
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="meter" role="img" aria-label={`${percent}%`}>
          <span style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="muted prose-measure text-[12px]">{t('offlinePackHint', lang)}</p>
    </section>
  );
}
