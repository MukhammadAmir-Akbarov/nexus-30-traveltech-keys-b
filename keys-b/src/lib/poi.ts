import type { I18nText, Poi, PoiKind } from './types.ts';

// Инфраструктура по маршруту. Из голосового отзыва: «одним действием найти
// ближайшие» — заправку с метаном, туалет, намазхону, медпункт, кафе.

export const POI_LABEL: Record<PoiKind, I18nText> = {
  gas: { uz: 'Zapravka', ru: 'Заправка', en: 'Fuel' },
  toilet: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' },
  prayer: { uz: 'Namozxona', ru: 'Молельная', en: 'Prayer room' },
  clinic: { uz: 'Tibbiy punkt', ru: 'Медпункт', en: 'Clinic' },
  cafe: { uz: 'Kafe', ru: 'Кафе', en: 'Cafe' },
};

export const POI_ICON: Record<PoiKind, string> = {
  gas: '⛽',
  toilet: '🚻',
  prayer: '🕌',
  clinic: '🏥',
  cafe: '🍵',
};

export const FUEL_LABEL: Record<string, I18nText> = {
  methane: { uz: 'metan', ru: 'метан', en: 'methane' },
  petrol: { uz: 'benzin', ru: 'бензин', en: 'petrol' },
};

export const POI_KINDS: PoiKind[] = ['gas', 'toilet', 'prayer', 'clinic', 'cafe'];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type NearbyPoi = { poi: Poi; km: number };

/**
 * Ближайшие точки к заданному месту — по одной на каждый запрошенный тип,
 * чтобы список не превращался в свалку из десяти заправок.
 */
export function nearestPois(
  pois: Poi[],
  point: { lat: number; lng: number },
  kinds: PoiKind[] = POI_KINDS,
): NearbyPoi[] {
  const result: NearbyPoi[] = [];
  for (const kind of kinds) {
    const candidates = pois
      .filter((poi) => poi.kind === kind)
      .map((poi) => ({ poi, km: distanceKm(point, poi) }))
      .sort((a, b) => a.km - b.km);
    // заправки показываем обе: метан и бензин — это разные потребности
    if (kind === 'gas') {
      for (const fuel of ['methane', 'petrol'] as const) {
        const nearest = candidates.find((c) => c.poi.fuel === fuel);
        if (nearest) result.push(nearest);
      }
    } else if (candidates[0]) {
      result.push(candidates[0]);
    }
  }
  return result.sort((a, b) => a.km - b.km);
}
