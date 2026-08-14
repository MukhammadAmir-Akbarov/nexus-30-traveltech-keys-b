'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { PLACE_BY_ID, REGION_LABEL } from '@/data/places';
import type { Itinerary, Mode, Place } from '@/lib/types';

// Leaflet трогает window — грузим только на клиенте.
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => <div className="card muted text-sm">Карта загружается…</div>,
});

export default function PlanPage() {
  const { trip } = useTrip();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [mode, setMode] = useState<Mode>('offline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const build = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { itinerary: Itinerary; mode: Mode };
      setItinerary(data.itinerary);
      setMode(data.mode);
    } catch {
      setError('Не удалось построить маршрут. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const orderedPlaces: Place[] =
    itinerary?.days
      .flatMap((day) => day.items)
      .map((item) => PLACE_BY_ID[item.placeId])
      .filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Маршрут под ваш формат поездки</h1>
          <p className="muted mt-1 text-sm">
            Собирается из контекста сверху: регион, интересы, формат и число дней.{' '}
            <Link href="/" className="underline" style={{ color: 'var(--accent)' }}>
              изменить
            </Link>
          </p>
        </div>
        <button className="btn btn-primary" disabled={loading} onClick={build}>
          {loading ? 'Собираю маршрут…' : 'Построить маршрут'}
        </button>
      </section>

      {error && <div className="card text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}

      {itinerary && (
        <>
          <section className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Итого</span>
              <span className="tag">{mode === 'ai' ? 'составлено моделью' : 'офлайн-режим'}</span>
            </div>
            <p className="text-sm">{itinerary.summary}</p>
          </section>

          {orderedPlaces.length > 0 && <RouteMap places={orderedPlaces} />}

          <section className="flex flex-col gap-3">
            {itinerary.days.map((day) => (
              <div key={day.day} className="card">
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold">День {day.day}</span>
                  <span className="muted text-[13px]">{day.title}</span>
                </div>
                <ol className="flex flex-col gap-3">
                  {day.items.map((item, index) => {
                    const place = PLACE_BY_ID[item.placeId];
                    if (!place) return null;
                    return (
                      <li key={item.placeId} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: 'var(--accent)' }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold">
                            {place.name}{' '}
                            <span className="muted font-normal">
                              · {REGION_LABEL[place.region]} · {place.visitMinutes} мин
                            </span>
                          </div>
                          <div className="muted text-[13px]">{item.note}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
