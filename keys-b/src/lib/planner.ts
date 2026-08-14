import type {
  I18nText,
  Itinerary,
  ItineraryDay,
  Lang,
  Place,
  Region,
  Transfer,
  TripContext,
} from './types.ts';
import { buildTransfer, transferHours } from './transfer.ts';

// Правило-основанный планировщик. Работает без сети — это одновременно
// и запасной путь, если LLM недоступен на демо.
//
// Два правила, взятые из отзыва на прототип:
// 1) объекты одного города группируются в день по бюджету времени, а не размазываются
//    по одному на день;
// 2) при выборе «весь Узбекистан» маршрут идёт Ташкент → города → Ташкент,
//    переезд между городами занимает часть дня.

const MINUTES_PER_DAY = 330; // ~5.5 часов осмотра, остальное — дорога и еда
/** Точка входа в страну: сюда прилетают и отсюда улетают. */
const ENTRY_REGION: Region = 'tashkent';

const TEXT = {
  family: {
    uz: 'Bolalar bilan sayohatga mos.',
    ru: 'Подходит для поездки с детьми.',
    en: 'Works well for a trip with children.',
  },
  matches: {
    uz: 'Qiziqishlaringizga mos keladi.',
    ru: 'Совпадает с вашими интересами.',
    en: 'Matches your interests.',
  },
  summerOutdoor: {
    uz: 'Yozda kunduzi +38 dan oshadi — bu obyektni tongda yoki kechqurun ko‘ring.',
    ru: 'Летом днём выше +38 — этот объект лучше смотреть утром или вечером.',
    en: 'Summer days exceed +38 °C — visit this open-air site in the morning or evening.',
  },
  more: { uz: 'yana', ru: 'ещё', en: 'plus' },
  empty: {
    uz: 'Tanlangan filtrlarga mos obyekt topilmadi — qiziqishlar sonini kamaytiring.',
    ru: 'Под выбранные фильтры объектов не нашлось — снимите часть интересов.',
    en: 'No places match the selected filters — remove some interests.',
  },
  summaryOneCity: {
    uz: '{days} kunlik marshrut: {n} ta obyekt, «{type}» formatiga moslangan.',
    ru: 'Маршрут на {days} дн.: {n} объектов, подобранных под формат «{type}».',
    en: 'A {days}-day itinerary: {n} places selected for the “{type}” format.',
  },
  summaryMultiCity: {
    uz: 'Mamlakat bo‘ylab {days} kunlik marshrut — shaharlar: {cities}, obyektlar: {n}. Boshlanish: Toshkent.',
    ru: 'Маршрут по стране на {days} дн. — городов: {cities}, объектов: {n}. Старт: Ташкент.',
    en: 'A {days}-day countrywide itinerary — cities: {cities}, places: {n}. Starts in Tashkent.',
  },
} satisfies Record<string, I18nText>;

const REGION_NAME: Record<Region, I18nText> = {
  samarkand: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
  bukhara: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
  khiva: { uz: 'Xiva', ru: 'Хива', en: 'Khiva' },
  tashkent: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
  shakhrisabz: { uz: 'Shahrisabz', ru: 'Шахрисабз', en: 'Shakhrisabz' },
  nurata: { uz: 'Nurota', ru: 'Нурата', en: 'Nurata' },
};

type Point = { lat: number; lng: number };

function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function centroid(places: Place[]): Point {
  const lat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const lng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  return { lat, lng };
}

export function scorePlace(place: Place, ctx: TripContext): number {
  let score = place.interests.filter((i) => ctx.interests.includes(i)).length * 2;
  if (ctx.region !== 'all' && place.region === ctx.region) score += 3;
  if (ctx.travelType === 'family' && place.familyFriendly) score += 1;
  if (ctx.travelType === 'group' && place.visitMinutes <= 60) score += 0.5;
  if (ctx.travelType === 'solo' && place.interests.includes('photo')) score += 0.5;
  return score;
}

/** Сортировка внутри дня: ближайший сосед от самого важного объекта. */
function orderByProximity(places: Place[]): Place[] {
  if (places.length <= 2) return places;
  const rest = places.slice(1);
  const ordered = [places[0]];
  while (rest.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (haversineKm(last, rest[i]) < haversineKm(last, rest[best])) best = i;
    }
    ordered.push(rest.splice(best, 1)[0]);
  }
  return ordered;
}

function noteFor(place: Place, ctx: TripContext, lang: Lang): string {
  const summary = place.summary[lang];
  // летом жара делает дневной осмотр под открытым небом тяжёлым (см. корпус, c34)
  if (ctx.summer && place.outdoor) return `${summary} ${TEXT.summerOutdoor[lang]}`;
  if (ctx.travelType === 'family' && place.familyFriendly) {
    return `${summary} ${TEXT.family[lang]}`;
  }
  if (place.interests.some((i) => ctx.interests.includes(i))) {
    return `${summary} ${TEXT.matches[lang]}`;
  }
  return summary;
}

function eligible(places: Place[], ctx: TripContext): Place[] {
  return places
    .filter((p) => ctx.region === 'all' || p.region === ctx.region)
    // формат «семья» — объекты без familyFriendly не предлагаем вовсе
    .filter((p) => ctx.travelType !== 'family' || p.familyFriendly)
    .map((p) => ({ place: p, score: scorePlace(p, ctx) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.place.visitMinutes - b.place.visitMinutes)
    .map((p) => p.place);
}

/**
 * Набивает один день объектами одного города по бюджету времени.
 * Именно здесь чинится жалоба «объекты рядом, а система дала им по отдельному дню».
 */
function fillDay(pool: Place[], budgetMinutes: number): Place[] {
  const picked: Place[] = [];
  let minutes = 0;
  for (const place of pool) {
    if (minutes + place.visitMinutes > budgetMinutes) continue;
    picked.push(place);
    minutes += place.visitMinutes;
  }
  if (picked.length === 0 && pool.length) picked.push(pool[0]);
  return picked;
}

function makeDay(
  dayNumber: number,
  picked: Place[],
  ctx: TripContext,
  lang: Lang,
  transfer?: Transfer,
): ItineraryDay {
  const ordered = orderByProximity(picked);
  const cityTitle = REGION_NAME[ordered[0].region][lang];
  return {
    day: dayNumber,
    title:
      ordered.length > 1
        ? `${cityTitle}: ${ordered[0].name[lang]} + ${TEXT.more[lang]} ${ordered.length - 1}`
        : `${cityTitle}: ${ordered[0].name[lang]}`,
    transfer,
    items: ordered.map((p) => ({ placeId: p.id, note: noteFor(p, ctx, lang) })),
  };
}

export function buildItinerary(places: Place[], ctx: TripContext): Itinerary {
  const lang = ctx.lang;
  const pool = eligible(places, ctx);
  if (pool.length === 0) return { summary: TEXT.empty[lang], days: [] };

  const byRegion = new Map<Region, Place[]>();
  for (const place of pool) {
    byRegion.set(place.region, [...(byRegion.get(place.region) ?? []), place]);
  }

  // Порядок городов: точка входа (Ташкент) первой, дальше — ближайший к предыдущему.
  const regions = [...byRegion.keys()];
  const route: Region[] = [];
  let current = regions.includes(ENTRY_REGION) ? ENTRY_REGION : regions[0];
  const remaining = new Set(regions);
  while (remaining.size) {
    route.push(current);
    remaining.delete(current);
    if (!remaining.size) break;
    current = [...remaining].sort(
      (a, b) =>
        haversineKm(centroid(byRegion.get(current)!), centroid(byRegion.get(a)!)) -
        haversineKm(centroid(byRegion.get(current)!), centroid(byRegion.get(b)!)),
    )[0];
  }

  const days: ItineraryDay[] = [];
  let previousRegion: Region | null = null;

  for (const region of route) {
    let cityPool = [...byRegion.get(region)!];
    let firstDayInCity = true;

    while (cityPool.length && days.length < ctx.days) {
      let budget = MINUTES_PER_DAY;
      let transfer: Transfer | undefined;

      // первый день в новом городе укорачивается на дорогу
      if (firstDayInCity && previousRegion && previousRegion !== region) {
        transfer = buildTransfer(
          previousRegion,
          region,
          haversineKm(centroid(byRegion.get(previousRegion)!), centroid(byRegion.get(region)!)),
        );
        budget = Math.max(120, MINUTES_PER_DAY - transferHours(transfer) * 60);
      }
      firstDayInCity = false;

      let picked = fillDay(cityPool, budget);
      // летом открытые объекты ставим в начало дня — на утреннюю прохладу
      if (ctx.summer) {
        picked = [...picked].sort((a, b) => Number(b.outdoor) - Number(a.outdoor));
      }
      cityPool = cityPool.filter((p) => !picked.includes(p));
      days.push(makeDay(days.length + 1, picked, ctx, lang, transfer));
      previousRegion = region;
    }
    if (days.length >= ctx.days) break;
  }

  // Возвращение в точку входа: только для маршрута по стране и если есть запас дня.
  const lastRegion = days.length ? previousRegion : null;
  if (
    ctx.region === 'all' &&
    lastRegion &&
    lastRegion !== ENTRY_REGION &&
    byRegion.has(ENTRY_REGION) &&
    days.length < ctx.days
  ) {
    const transfer = buildTransfer(
      lastRegion,
      ENTRY_REGION,
      haversineKm(centroid(byRegion.get(lastRegion)!), centroid(byRegion.get(ENTRY_REGION)!)),
    );
    const used = new Set(days.flatMap((d) => d.items.map((i) => i.placeId)));
    const leftovers = byRegion.get(ENTRY_REGION)!.filter((p) => !used.has(p.id));
    if (leftovers.length) {
      const picked = fillDay(
        leftovers,
        Math.max(120, MINUTES_PER_DAY - transferHours(transfer) * 60),
      );
      days.push(makeDay(days.length + 1, picked, ctx, lang, transfer));
    }
  }

  const total = days.reduce((sum, d) => sum + d.items.length, 0);
  const cities = new Set(days.flatMap((d) => d.items.map((i) => pool.find((p) => p.id === i.placeId)!.region)));
  const template = cities.size > 1 ? TEXT.summaryMultiCity : TEXT.summaryOneCity;

  return {
    summary: template[lang]
      .replace('{days}', String(days.length))
      .replace('{n}', String(total))
      .replace('{cities}', String(cities.size))
      .replace('{type}', ctx.travelType),
    days,
  };
}
