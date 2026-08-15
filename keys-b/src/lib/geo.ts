import { haversineKm } from './route.ts';
import { PLACES } from '../data/places.ts';
import type { Region } from './types.ts';

/**
 * Определение ближайшего города по координатам туриста.
 *
 * ЗАЧЕМ. Турист уже находится где-то в стране, и спрашивать его «откуда вы
 * начинаете» вторым вопросом подряд — лишнее, если телефон может ответить сам.
 *
 * ПРИВАТНОСТЬ — тут же, а не в политике мелким шрифтом. §9 кейса требует
 * учитывать защиту данных, поэтому правило простое и проверяемое: координаты
 * НИКУДА не уходят. Вся работа — вот эта функция, она чистая и считает
 * расстояние до центров городов локально, в браузере. На сервер уезжает
 * максимум название региона, то же самое, что турист выбрал бы пальцем.
 */

/** Центр города = среднее по его объектам. Отдельная таблица координат не нужна. */
function regionCenters(): Map<Region, { lat: number; lng: number }> {
  const sums = new Map<Region, { lat: number; lng: number; n: number }>();
  for (const place of PLACES) {
    const acc = sums.get(place.region) ?? { lat: 0, lng: 0, n: 0 };
    sums.set(place.region, { lat: acc.lat + place.lat, lng: acc.lng + place.lng, n: acc.n + 1 });
  }
  const centers = new Map<Region, { lat: number; lng: number }>();
  for (const [region, acc] of sums) {
    centers.set(region, { lat: acc.lat / acc.n, lng: acc.lng / acc.n });
  }
  return centers;
}

const CENTERS = regionCenters();

/**
 * Насколько далеко от города турист ещё считается «в этом городе».
 *
 * 150 км — это примерно расстояние Самарканд–Шахрисабз. Дальше этого порога
 * определять старт по координатам нечестно: человек в Астане получил бы
 * «вы в Ташкенте», и первый же экран соврал бы ему. Лучше не ответить,
 * чем ответить неверно.
 */
export const NEAR_LIMIT_KM = 150;

export type NearestRegion = { region: Region; km: number } | null;

export function nearestRegion(lat: number, lng: number): NearestRegion {
  let best: { region: Region; km: number } | null = null;

  for (const [region, center] of CENTERS) {
    const km = haversineKm({ lat, lng }, center);
    if (!best || km < best.km) best = { region, km };
  }

  if (!best || best.km > NEAR_LIMIT_KM) return null;
  return best;
}
