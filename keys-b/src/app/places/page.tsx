'use client';

import Link from 'next/link';
import { PinButton } from '@/components/PinButton';
import { PlacePhoto } from '@/components/PlacePhoto';
import { SaveButton } from '@/components/SaveButton';
import { officialFactsFor } from '@/lib/sources';
import { CORPUS } from '@/data/corpus';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { PLACES } from '@/data/places';
import { isOpenAt } from '@/lib/hours';
import { useTashkentMinutes } from '@/lib/use-clock';
import { INTERESTS, INTEREST_LABEL, REGIONS, REGION_LABEL, t, tr } from '@/lib/i18n';
import { normalize } from '@/lib/retrieval';
import type { Interest, Region } from '@/lib/types';

// Каталог объектов. До него добраться до конкретного объекта можно было только
// через маршрут или QR у входа: 31 объект в базе и ни одного способа их
// посмотреть. Поиск использует ту же нормализацию, что и фактчек, поэтому
// «Регистан», «registon» и «REGISTAN» находят одно и то же.

function PlacesPageInner() {
  const { lang } = useTrip();
  // Строка приходит из поиска на главной (`/places?q=…`). Начальное значение
  // берём один раз: дальше полем владеет пользователь, и перезаписывать его
  // из адреса на каждом рендере было бы враждебно.
  const [query, setQuery] = useState(useSearchParams().get('q') ?? '');
  const [region, setRegion] = useState<Region | 'all'>('all');
  // Отбор сверх поиска и региона. Регион и строка отвечают на «где» и «как
  // называется», а человек чаще спрашивает другое: что бесплатно, что открыто
  // прямо сейчас и куда проедет коляска.
  const [interests, setInterests] = useState<Interest[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  // На сервере часов нет: до гидратации фильтр «открыто сейчас» не жмётся,
  // потому что честного ответа у нас в этот момент тоже нет.
  const now = useTashkentMinutes();

  const dirty = Boolean(query) || region !== 'all' || interests.length > 0 || freeOnly || openOnly || accessibleOnly;
  const reset = () => {
    setQuery('');
    setRegion('all');
    setInterests([]);
    setFreeOnly(false);
    setOpenOnly(false);
    setAccessibleOnly(false);
  };

  const found = useMemo(() => {
    const needle = normalize(query);
    return PLACES.filter((place) => {
      if (region !== 'all' && place.region !== region) return false;
      if (interests.length && !place.interests.some((i) => interests.includes(i))) return false;
      if (freeOnly && place.ticketUsd) return false;
      if (accessibleOnly && !place.accessible) return false;
      // у площадей часов работы нет — они открыты всегда, а не «неизвестно»
      if (openOnly && now !== null && isOpenAt(place, now) === false) return false;
      if (!needle) return true;
      // ищем по всем трём языкам сразу: турист может знать название по-разному
      const haystack = normalize(
        [place.name.uz, place.name.ru, place.name.en, place.summary[lang]].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [query, region, lang, interests, freeOnly, openOnly, accessibleOnly, now]);

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

        <div>
          <div className="mb-2 text-sm font-semibold">{t('placesFilters', lang)}</div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                className="chip"
                data-active={interests.includes(interest)}
                onClick={() =>
                  setInterests(
                    interests.includes(interest)
                      ? interests.filter((i) => i !== interest)
                      : [...interests, interest],
                  )
                }
              >
                {tr(INTEREST_LABEL[interest], lang)}
              </button>
            ))}
            <button className="chip" data-active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>
              {t('placesFree', lang)}
            </button>
            <button
              className="chip"
              data-active={openOnly}
              disabled={now === null}
              onClick={() => setOpenOnly(!openOnly)}
            >
              <Icon name="clock" size={13} />
              {t('placesOpenNow', lang)}
            </button>
            <button
              className="chip"
              data-active={accessibleOnly}
              onClick={() => setAccessibleOnly(!accessibleOnly)}
            >
              {t('placesAccessible', lang)}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="muted">
            {t('placesFound', lang)}: <b>{found.length}</b>
          </span>
          {dirty && (
            <button className="chip" onClick={reset}>
              {t('placesReset', lang)}
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {found.length === 0 && <div className="card muted text-sm">{t('placesEmpty', lang)}</div>}

        {found.map((place) => (
          <Link key={place.id} href={`/place/${place.id}`} className="card card-link flex flex-col gap-2">
            <PlacePhoto placeId={place.id} alt={tr(place.name, lang)} lang={lang} />
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
              {officialFactsFor(CORPUS, place.id).official > 0 && (
                <span className="tag tag-ok" title={t('officialHint', lang)}>
                  <Icon name="shield" size={12} />
                  {t('officialShort', lang)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <SaveButton placeId={place.id} compact />
              {/* поставить объект в маршрут можно было только из самого
                  маршрута — то есть тот, которого там нет, поставить нельзя */}
              <PinButton placeId={place.id} compact />
            </div>

            <div className="muted text-[12px]">
              {place.interests.map((i) => tr(INTEREST_LABEL[i], lang)).join(', ')}
            </div>
          </Link>
        ))}
      </section>

      {/* Права на снимки называем один раз внизу списка: у каждой карточки
          подпись заслоняла бы сам объект, а не сказать нельзя. */}
      <p className="muted text-[12px]">{t('photoLicense', lang)}</p>
    </div>
  );
}

/**
 * useSearchParams требует границы Suspense: без неё страницу нельзя
 * отрендерить заранее. Тот же приём уже стоит на /check.
 */
export default function PlacesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
      <PlacesPageInner />
    </Suspense>
  );
}
