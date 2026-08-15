'use client';

import { useEffect, useRef, useState } from 'react';
import { directRoute, fetchDayRoute, type DayRoute, type LatLng } from './route.ts';

/** Точки одного дня в порядке осмотра. */
export type DayPoints = { day: number; points: LatLng[] };

const signature = (days: DayPoints[]) =>
  days.map((d) => `${d.day}:${d.points.map((p) => `${p.lat},${p.lng}`).join('|')}`).join(';');

/** Прямые линии: то, что можно показать сразу, не дожидаясь маршрутизатора. */
const straight = (days: DayPoints[]): DayRoute[] =>
  days.map((d) => ({ day: d.day, ...directRoute(d.points), source: 'direct' as const }));

/**
 * Маршруты дней по дорогам. До ответа сети возвращает прямые линии, поэтому
 * карта и список переходов не бывают пустыми ни секунды.
 */
export function useDayRoutes(days: DayPoints[]): DayRoute[] {
  const routable = days.filter((d) => d.points.length >= 2);
  const key = signature(routable);
  const [loaded, setLoaded] = useState<{ key: string; routes: DayRoute[] } | null>(null);

  // Данные читаем через ref, а эффект держим на строковом ключе: массив дней —
  // новый объект на каждый рендер, иначе запрос уходил бы бесконечно.
  const data = useRef(routable);
  useEffect(() => {
    data.current = routable;
  });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    void Promise.all(
      data.current.map(async (d) => ({
        day: d.day,
        ...(await fetchDayRoute(d.points, controller.signal)),
      })),
    ).then((routes) => {
      if (!controller.signal.aborted) setLoaded({ key, routes });
    });
    return () => controller.abort();
  }, [key]);

  return loaded?.key === key ? loaded.routes : straight(routable);
}
