import type { I18nText, Poi, PoiKind } from './types.ts';

// Инфраструктура по маршруту. Из голосового отзыва: «одним действием найти
// ближайшие» — заправку с метаном, туалет, намазхону, медпункт, кафе.

export const POI_LABEL: Record<PoiKind, I18nText> = {
  gas: { uz: 'Zapravka', ru: 'Заправка', en: 'Fuel' },
  toilet: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' },
  prayer: { uz: 'Namozxona', ru: 'Молельная', en: 'Prayer room' },
  clinic: { uz: 'Tibbiy punkt', ru: 'Медпункт', en: 'Clinic' },
  hospital: { uz: 'Shifoxona', ru: 'Больница', en: 'Hospital' },
  pharmacy: { uz: 'Dorixona', ru: 'Аптека', en: 'Pharmacy' },
  atm: { uz: 'Bankomat', ru: 'Банкомат', en: 'ATM' },
  bank: { uz: 'Bank', ru: 'Банк', en: 'Bank' },
  parking: { uz: 'Avtoturargoh', ru: 'Парковка', en: 'Parking' },
  cafe: { uz: 'Kafe', ru: 'Кафе', en: 'Cafe' },
  restaurant: { uz: 'Restoran', ru: 'Ресторан', en: 'Restaurant' },
  shop: { uz: 'Do‘kon', ru: 'Магазин', en: 'Shop' },
  water: { uz: 'Ichimlik suvi', ru: 'Питьевая вода', en: 'Drinking water' },
};

/** Имена иконок из общего набора — эмодзи в интерфейсе не используем. */
export const POI_ICON: Record<PoiKind, IconName> = {
  gas: 'fuel',
  toilet: 'toilet',
  prayer: 'mosque',
  clinic: 'clinic',
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  atm: 'atm',
  bank: 'bank',
  parking: 'parking',
  cafe: 'cafe',
  restaurant: 'restaurant',
  shop: 'shop',
  water: 'water',
};

type IconName =
  | 'fuel'
  | 'toilet'
  | 'mosque'
  | 'clinic'
  | 'hospital'
  | 'pharmacy'
  | 'atm'
  | 'bank'
  | 'parking'
  | 'cafe'
  | 'restaurant'
  | 'shop'
  | 'water';

export const FUEL_LABEL: Record<string, I18nText> = {
  methane: { uz: 'metan', ru: 'метан', en: 'methane' },
  petrol: { uz: 'benzin', ru: 'бензин', en: 'petrol' },
};

/**
 * Порядок — это порядок в карточке. Сначала то, что ищут в беде
 * (аптека, больница), потом бытовое, в конце — приятное.
 */
export const POI_KINDS: PoiKind[] = [
  'toilet',
  'pharmacy',
  'hospital',
  'clinic',
  'atm',
  'bank',
  'water',
  'prayer',
  'parking',
  'gas',
  'cafe',
  'restaurant',
  'shop',
];

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
