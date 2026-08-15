'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { staysFor } from '@/data/stays';
import { PLACE_BY_ID } from '@/data/places';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { Region } from '@/lib/types';

/**
 * «Где ночевать» для города дня.
 *
 * Показываем районы, а не карточки отелей: названия и цены конкретных гостиниц
 * мы проверить не можем, а выдуманный отель с выдуманной ценой — ровно тот сорт
 * непроверяемых данных, против которого сделан весь продукт (см. data/stays.ts).
 *
 * Бронирование не делаем осознанно: для него нужен юридический контур,
 * а недоделанное бронирование выглядит хуже отсутствующего. Вместо этого —
 * ссылка в живой поиск с уже подставленными городом и датами: там цены
 * настоящие и сегодняшние, чего мы про свои данные сказать не можем.
 */

/** Поиск жилья вынесен одной строкой: провайдера меняем здесь, а не по всему коду. */
function searchUrl(city: string, from?: string, to?: string): string {
  const params = new URLSearchParams({ ss: city });
  if (from) params.set('checkin', from);
  if (to) params.set('checkout', to);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function StayPanel({ region }: { region: Region }) {
  const { trip, lang } = useTrip();
  const [open, setOpen] = useState(false);

  const stays = staysFor(region);
  if (stays.length === 0) return null;

  const cityName = tr(REGION_LABEL[region], lang);

  return (
    <div className="mt-3">
      <button
        className="chip"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="pin" size={13} />
        {t('stayTitle', lang)} · {cityName}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {stays.map((stay) => {
            const near = stay.nearPlaceId ? PLACE_BY_ID[stay.nearPlaceId] : undefined;
            return (
              <div
                key={stay.id}
                className="rounded-[var(--radius-sm)] p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <b className="text-[14px]">{tr(stay.name, lang)}</b>
                  {/* Вилка, а не цена: это ориентир по демо-данным, и так подписано */}
                  <span className="muted text-[12px]">
                    ≈ ${stay.fromUsd}–{stay.toUsd} / {t('stayPerNight', lang)}
                  </span>
                </div>
                <p className="muted mt-1 text-[13px]">{tr(stay.why, lang)}</p>
                {near && (
                  <p className="muted mt-1 text-[12px]">
                    {t('stayNear', lang)} {tr(near.name, lang)}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <a
              className="btn"
              href={searchUrl(cityName, trip.startDate, trip.endDate)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="external" size={14} />
              {t('staySearch', lang)}
            </a>
            <span className="muted text-[12px]">{t('stayDisclaimer', lang)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
