'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { NearbyPois } from '@/components/NearbyPois';
import { RequestForm } from '@/components/RequestForm';
import { SpeakButton } from '@/components/SpeakButton';
import { useTrip } from '@/components/TripProvider';
import { photoOf } from '@/data/photos';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { CorpusItem, Place } from '@/lib/types';

/**
 * Карточка объекта: крупный кадр сверху, белый лист с деталями внахлёст.
 *
 * Оформление мобильное, но данные — наши:
 *
 * - photoOf() возвращает ОБЪЕКТ {src, author, license, ...}, а не строку.
 *   Подстановка его в url(...) давала url('[object Object]'), то есть кадр
 *   не показывался ни на одном объекте, у которого фотография как раз есть.
 * - Внешнего запасного изображения нет: у объекта без фото просто нет шапки.
 *   Картинка с чужого домена превращается в пустой прямоугольник ровно тогда,
 *   когда в зале падает сеть, а офлайн мы обещаем сами.
 * - Рейтинга «4.8/5» нет: отзывов у объектов не существует, взять число
 *   неоткуда. Вместо него в строке показателей стоит то, что правда есть, —
 *   время осмотра и количество фактов с источником.
 * - Цвета из токенов, а не slate/teal хардкодом: иначе тёмная тема даёт
 *   тёмный текст на тёмном фоне.
 * - Нижняя панель не fixed: в layout уже есть TabBar, и фиксированная
 *   кнопка садилась бы прямо на него.
 */
export function PlaceCard({ place, facts }: { place: Place; facts: CorpusItem[] }) {
  const { lang } = useTrip();
  const photo = photoOf(place.id);

  return (
    <div className="flex flex-col">
      {photo && (
        <div className="relative -mx-4 -mt-6 aspect-[16/10] w-[calc(100%+2rem)] sm:aspect-[21/9]">
          <Image
            src={photo.src}
            alt={tr(place.name, lang)}
            fill
            sizes="(max-width: 1024px) 100vw, 1000px"
            className="object-cover"
            priority
          />
          <Link
            href="/places"
            aria-label={t('homeAllPlaces', lang)}
            className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] backdrop-blur-md"
            style={{ background: 'rgb(0 0 0 / 0.35)', color: '#fff' }}
          >
            ←
          </Link>
        </div>
      )}

      {/* Лист с деталями внахлёст на кадр */}
      <div
        className={`relative z-10 flex flex-col gap-6 rounded-t-[var(--radius-lg)] px-5 pt-6 ${photo ? '-mt-8' : ''}`}
        style={{ background: 'var(--bg)' }}
      >
        <div>
          <div className="muted text-[13px]">{tr(REGION_LABEL[place.region], lang)}</div>
          <h1 className="mt-1 text-2xl font-bold">{tr(place.name, lang)}</h1>
        </div>

        {/* Показатели: только то, что у нас действительно есть */}
        <div
          className="flex items-center justify-between gap-2 py-4"
          style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="muted text-[11px] font-semibold uppercase">
              {t('placeStatTime', lang)}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Icon name="clock" size={14} />
              {place.visitMinutes} {t('planMinutes', lang)}
            </span>
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />

          <div className="flex flex-col items-center gap-1">
            <span className="muted text-[11px] font-semibold uppercase">
              {t('placeStatFacts', lang)}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Icon name="check" size={14} />
              {facts.length}
            </span>
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />

          <div className="flex flex-col items-center gap-1">
            <span className="muted text-[11px] font-semibold uppercase">
              {t('placeStatListen', lang)}
            </span>
            <SpeakButton
              text={[tr(place.name, lang), tr(place.summary, lang), ...facts.map((f) => f.text)].join(
                '. ',
              )}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold">{t('placeOverview', lang)}</h2>
          <p className="muted prose-measure text-sm">{tr(place.summary, lang)}</p>
        </div>

        {place.highlights && place.highlights.length > 0 && (
          <div>
            <h2 className="mb-2 text-lg font-bold">{t('placeHighlights', lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {place.highlights.map((item) => (
                <span
                  key={item.en}
                  className="rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold"
                  // --accent-ink, а не --accent: на своей же светлой подложке
                  // обычный акцент даёт 3.95:1 и не дотягивает до нормы
                  style={{ background: 'var(--accent-weak)', color: 'var(--accent-ink)' }}
                >
                  {tr(item, lang)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-lg font-bold">{t('placeFacts', lang)}</h2>
          {facts.length === 0 && <div className="muted text-sm">{t('placeNoFacts', lang)}</div>}
          <div className="flex flex-col gap-3">
            {facts.map((fact) => (
              <div
                key={fact.id}
                className="rounded-[var(--radius-sm)] p-3 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p>{fact.text}</p>
                <a
                  href={fact.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs font-semibold hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  {tr(fact.source.title, lang)} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        <NearbyPois place={place} />

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/check?place=${place.id}`} className="btn btn-primary">
            <Icon name="check" />
            {t('placeCheckHere', lang)}
          </Link>
          <Link href="/plan" className="btn">
            <Icon name="route" />
            {t('tabPlan', lang)}
          </Link>
          {/* обратная связь с места: закрыто, ремонт, обман с ценой */}
          <RequestForm kind="place-problem" targetId={place.id} />
        </div>

        {/* Кадр показан крупно — подпись стоит здесь же. CC BY-SA требует
            указать автора; полный список всех фотографий собран на /how. */}
        {photo && (
          <p className="muted text-[11.5px]">
            {t('photoBy', lang)}{' '}
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              {photo.author}
            </a>{' '}
            ·{' '}
            <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline">
              {photo.license}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
