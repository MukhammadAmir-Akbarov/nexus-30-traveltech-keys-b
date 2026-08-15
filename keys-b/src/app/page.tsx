'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { CORPUS } from '@/data/corpus';
import { FEATURED_IDS, HOME_FEATURED_COUNT } from '@/data/featured';
import { photoOf } from '@/data/photos';
import { PLACES, PLACE_BY_ID } from '@/data/places';
import { REGIONS, REGION_LABEL, t, tr } from '@/lib/i18n';

/**
 * Главная — витрина страны, а не анкета.
 *
 * Было: форма контекста поездки, а поверх неё при первом входе модальный опрос
 * из четырёх шагов. Человек отвечал на вопросы раньше, чем понимал, что за
 * продукт перед ним. Вопросы переехали в /plan — туда, где турист сам захотел
 * маршрут, и где они наконец осмысленны.
 *
 * Оформление — бирюзовая шапка мобильного приложения, но на токенах дизайн-
 * системы (--accent и есть тот самый бирюзовый), а не на хардкоде: иначе
 * тёмная тема на первом же экране разъезжается.
 *
 * ЧЕГО ЗДЕСЬ НЕТ И ПОЧЕМУ:
 *
 * - Внешних картинок. Фотографии лежат в public/places и пришли с Викисклада
 *   с автором и лицензией. Demo обязано пережить падение сети в зале: картинка
 *   с чужого домена в этот момент станет белым прямоугольником на первом экране.
 * - Рейтингов вида «4.9». Нам их неоткуда взять: отзывов у объектов нет,
 *   статистики посещаемости — тоже. Нарисованная звёздочка в продукте про
 *   достоверность — это ровно то, в чём мы упрекаем недобросовестного гида.
 *   Вместо неё показываем то, что у нас правда есть: число фактов с источником.
 * - Строк в коде. Интерфейс трёхъязычный, и словарь один — src/lib/i18n.ts.
 *
 * Атрибуции под каждой карточкой тоже нет — она повторялась шесть раз и делала
 * витрину рябой. CC BY-SA требует указать автора «разумным образом», а не под
 * каждой миниатюрой: подпись стоит на странице объекта, где кадр показан
 * крупно, и полным списком на /how.
 */

/** Сколько фактов корпуса стоит за объектом — это и есть наша единица доверия. */
function factsFor(placeId: string) {
  return CORPUS.filter((item) => item.placeId === placeId);
}

export default function Home() {
  const { trip, lang, update } = useTrip();
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Живой поиск, а не декоративное поле: строка уходит в каталог, где уже есть
  // поиск по трём языкам и фильтр по региону. Поле, которое ничего не делает,
  // хуже отсутствующего — жюри нажимает именно на такие.
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/places?q=${encodeURIComponent(value)}` : '/places');
  };

  const featured = FEATURED_IDS.slice(0, HOME_FEATURED_COUNT).flatMap((id) => {
    const place = PLACE_BY_ID[id];
    const photo = photoOf(id);
    // отсутствие любого из двух — ошибка данных, её ловит npm run check;
    // в рантайме просто не показываем карточку, а не роняем главную
    return place && photo ? [{ place, photo, facts: factsFor(id) }] : [];
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Шапка во всю ширину: вытягиваем за отступы <main>, не выходя из потока.
          position:absolute здесь ломает Nav, TabBar и футер — они соседи по layout. */}
      <section
        className="-mx-4 -mt-6 flex flex-col gap-5 px-6 pt-8 pb-8 sm:rounded-b-[32px]"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        <div>
          <p className="text-[13px] opacity-90">{t('homeGreeting', lang)}</p>
          <h1 className="mt-1 text-[28px] leading-tight font-bold sm:text-[32px]">
            {t('homeHeroTitle', lang)}
          </h1>
        </div>

        <form onSubmit={submitSearch} role="search" className="relative">
          <label htmlFor="home-search" className="sr-only">
            {t('homeSearchLabel', lang)}
          </label>
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('homeSearchLabel', lang)}
            className="w-full rounded-[var(--radius-pill)] py-4 pr-14 pl-5 focus:outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            aria-label={t('homeSearchLabel', lang)}
            className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-pill)]"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            <Icon name="search" />
          </button>
        </form>

        {/* Регион выбирается прямо здесь и сохраняется в контекст поездки —
            дальше его читают и маршрут, и подбор гида. */}
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {REGIONS.map((region) => {
            const active =
              region === 'all' ? trip.regions.length === 0 : trip.regions.includes(region);
            return (
              <button
                key={region}
                aria-pressed={active}
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
                className="shrink-0 rounded-[var(--radius-pill)] px-4 py-2 text-[13px] font-medium whitespace-nowrap"
                style={
                  active
                    ? { background: 'var(--surface)', color: 'var(--accent)' }
                    : { background: 'rgb(255 255 255 / 0.18)', color: 'var(--on-accent)' }
                }
              >
                {region === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[region], lang)}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t('homeFeatured', lang)}</h2>
          {/* Число берётся из данных: обещать «31 объект» строкой в словаре
              значит однажды соврать — база растёт, а строка нет. */}
          <Link href="/places" className="text-[13px] underline" style={{ color: 'var(--accent)' }}>
            {t('homeAllPlaces', lang)} ({PLACES.length})
          </Link>
        </div>
        <p className="muted prose-measure mb-4 text-[13px]">{t('homeFeaturedLead', lang)}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ place, photo, facts }, index) => (
            <article key={place.id} className="card appear flex flex-col gap-0 overflow-hidden p-0">
              <Link href={`/place/${place.id}`} className="block">
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={photo.src}
                    alt={tr(place.name, lang)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    // первый ряд — это то, что видно без прокрутки
                    priority={index < 3}
                  />
                </div>
              </Link>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`/place/${place.id}`} className="text-[15px] font-semibold">
                    {tr(place.name, lang)}
                  </Link>
                  <span className="muted text-[12.5px]">
                    {tr(REGION_LABEL[place.region], lang)}
                  </span>
                </div>

                <p className="muted flex-1 text-[13px]">{tr(place.summary, lang)}</p>

                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  {facts.length > 0 && (
                    <span className="tag">
                      <Icon name="check" size={13} />
                      {facts.length} {t('homeFactsCount', lang)}
                    </span>
                  )}
                  <span className="tag">
                    <Icon name="clock" size={13} />
                    {place.visitMinutes} {t('planMinutes', lang)}
                  </span>
                  {place.ticketUsd ? <span className="tag">${place.ticketUsd}</span> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/check" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardCheckTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardCheckText', lang)}</p>
        </Link>
        <Link href="/plan" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardPlanTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardPlanText', lang)}</p>
        </Link>
        <Link href="/guides" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardGuidesTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardGuidesText', lang)}</p>
        </Link>
      </section>
    </div>
  );
}
