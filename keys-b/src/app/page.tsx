'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { CORPUS } from '@/data/corpus';
import { FEATURED_IDS } from '@/data/featured';
import { photoOf } from '@/data/photos';
import { PLACE_BY_ID } from '@/data/places';
import { REGION_LABEL, t, tr } from '@/lib/i18n';

/**
 * Главная — витрина страны, а не анкета.
 *
 * Было: форма контекста поездки, а поверх неё при первом входе модальный опрос
 * из четырёх шагов. Человек отвечал на вопросы раньше, чем понимал, что за
 * продукт перед ним, и это отталкивало ровно на том экране, который должен
 * притягивать. Вопросы переехали в /plan — туда, где турист сам захотел
 * маршрут, и где они наконец осмысленны.
 *
 * Показываем то, ради чего вообще едут: объекты, фотографии, факты с источником.
 */

/** Сколько фактов корпуса стоит за объектом — это и есть наша единица доверия. */
function factsFor(placeId: string) {
  return CORPUS.filter((item) => item.placeId === placeId);
}

export default function Home() {
  const { lang } = useTrip();

  const featured = FEATURED_IDS.flatMap((id) => {
    const place = PLACE_BY_ID[id];
    const photo = photoOf(id);
    // отсутствие любого из двух — ошибка данных, её ловит npm run check;
    // в рантайме просто не показываем карточку, а не роняем главную
    return place && photo ? [{ place, photo, facts: factsFor(id) }] : [];
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1>{t('homeTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('homeLead', lang)}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/plan" className="btn btn-primary">
            <Icon name="route" />
            {t('homeCtaPlan', lang)}
          </Link>
          <Link href="/check" className="btn">
            <Icon name="check" />
            {t('homeCtaCheck', lang)}
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t('homeFeatured', lang)}</h2>
          <Link href="/places" className="text-[13px] underline" style={{ color: 'var(--accent)' }}>
            {t('homeAllPlaces', lang)}
          </Link>
        </div>
        <p className="muted prose-measure mb-4 text-[13px]">{t('homeFeaturedLead', lang)}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ place, photo, facts }) => (
            <article key={place.id} className="card appear flex flex-col gap-0 overflow-hidden p-0">
              <Link href={`/place/${place.id}`} className="block">
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={photo.src}
                    alt={tr(place.name, lang)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    // первые три карточки — это то, что видно без прокрутки
                    priority={FEATURED_IDS.indexOf(place.id) < 3}
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

                {/* Лицензия CC BY-SA требует указать автора. Заодно это тот же
                    принцип, что и с фактами: на витрине нет данных без источника. */}
                <div className="muted text-[11px]">
                  {t('photoBy', lang)}{' '}
                  <a
                    href={photo.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {photo.author}
                  </a>{' '}
                  ·{' '}
                  <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                    {photo.license}
                  </a>
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
