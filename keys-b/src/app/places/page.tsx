'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { photoOf } from '@/data/photos';
import { PLACES } from '@/data/places';
import { INTEREST_LABEL, REGIONS, REGION_LABEL, t, tr } from '@/lib/i18n';
import { normalize } from '@/lib/retrieval';
import type { Region } from '@/lib/types';

// Каталог объектов. До него добраться до конкретного объекта можно было только
// через маршрут или QR у входа: 31 объект в базе и ни одного способа их
// посмотреть. Поиск использует ту же нормализацию, что и фактчек, поэтому
// «Регистан», «registon» и «REGISTAN» находят одно и то же.

/**
 * useSearchParams требует Suspense: без него страница уходит в динамический
 * рендер целиком и теряет пререндер. Оболочка ниже — ровно для этого.
 */
export default function PlacesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
      <PlacesCatalog />
    </Suspense>
  );
}

function PlacesCatalog() {
  const { lang } = useTrip();
  // с главной приходят как /places?q=..., поэтому строка поиска стартует
  // не пустой: иначе поле на главной выглядело бы работающим, но теряло ввод
  const initialQuery = useSearchParams().get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState<Region | 'all'>('all');

  const found = useMemo(() => {
    const needle = normalize(query);
    return PLACES.filter((place) => {
      if (region !== 'all' && place.region !== region) return false;
      if (!needle) return true;
      // ищем по всем трём языкам сразу: турист может знать название по-разному
      const haystack = normalize(
        [place.name.uz, place.name.ru, place.name.en, place.summary[lang]].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [query, region, lang]);

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1>{t('placesTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('placesLead', lang)}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <input
          className="field"
          placeholder={t('placesSearch', lang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('placesSearch', lang)}
        />
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((value) => (
            <button
              key={value}
              className="chip"
              data-active={region === value}
              onClick={() => setRegion(value)}
            >
              {value === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[value], lang)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {found.length === 0 && <div className="card muted text-sm">{t('placesEmpty', lang)}</div>}

        {found.map((place) => {
          // Фотография есть не у всех объектов — витринные пришли с Викисклада
          // с автором и лицензией. Карточка без фото не ломается, а просто
          // остаётся текстовой: пустая серая рамка выглядит хуже её отсутствия.
          const photo = photoOf(place.id);
          return (
          <Link key={place.id} href={`/place/${place.id}`} className="card card-link flex flex-col gap-2">
            {photo && (
              <div className="relative -mx-4 -mt-4 mb-1 aspect-[3/2] overflow-hidden rounded-t-[inherit]">
                <Image
                  src={photo.src}
                  alt={tr(place.name, lang)}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-[15px] font-semibold">{tr(place.name, lang)}</div>
            <p className="muted text-[13px]">{tr(place.summary, lang)}</p>

            <div className="mt-auto flex flex-wrap gap-2 text-[12px]">
              <span className="tag">{tr(REGION_LABEL[place.region], lang)}</span>
              <span className="tag">
                <Icon name="clock" size={12} />
                {place.visitMinutes} {t('planMinutes', lang)}
              </span>
              {place.ticketUsd ? <span className="tag">${place.ticketUsd}</span> : null}
              {place.accessible && (
                <span className="tag tag-ok">{t('placesAccessible', lang)}</span>
              )}
            </div>

            <div className="muted text-[12px]">
              {place.interests.map((i) => tr(INTEREST_LABEL[i], lang)).join(', ')}
            </div>

            {/* CC BY-SA требует указать автора там, где показан кадр */}
            {photo && (
              <div className="muted text-[11px]">
                {t('photoBy', lang)} {photo.author} · {photo.license}
              </div>
            )}
          </Link>
          );
        })}
      </section>
    </div>
  );
}
