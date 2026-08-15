/**
 * Маршрут по дорогам, а не прямая линия между точками.
 *
 * Прямая линия на карте врёт дважды: она рисует путь сквозь кварталы, где
 * пройти нельзя, и молчит о том, сколько идти. Туристу нужно другое — как
 * добраться от объекта к объекту: пешком или на такси, сколько это займёт
 * и сколько стоит.
 *
 * Геометрию и расстояния берём у OSRM (открытый маршрутизатор по данным
 * OpenStreetMap, без ключа). Если он не ответил — рисуем прямые и честно
 * помечаем их как прямые, а не выдаём за дорогу.
 */

export type LatLng = { lat: number; lng: number };

export type LegMode = 'walk' | 'taxi';

/** Переход между двумя соседними объектами дня. */
export type RouteLeg = {
  km: number;
  minutes: number;
  mode: LegMode;
  /** Ориентировочная цена такси, $. У пешего перехода — 0. */
  fareUsd: number;
};

/** Готовый маршрут одного дня: линия для карты и переходы для списка. */
export type DayRoute = {
  day: number;
  /** Геометрия в порядке MapLibre: [lng, lat]. */
  line: [number, number][];
  legs: RouteLeg[];
  /** roads — по дорогам, direct — прямые линии (маршрутизатор недоступен). */
  source: 'roads' | 'direct';
};

/** Цвета дней: маршрут читается с одного взгляда, без легенды под картой. */
export const DAY_COLORS = [
  '#0d7a75',
  '#c2610a',
  '#5b53c4',
  '#a3123f',
  '#2f7d1f',
  '#8a6d00',
  '#0f6ea8',
];

export function dayColor(day: number): string {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}

/** Пешеходная скорость с остановками на светофорах и фотографии. */
export const WALK_KMH = 4.5;

/** Дальше этого пешком никто не идёт по жаре — считаем такси. */
export const WALK_MAX_KM = 1.5;

/** Дорога всегда длиннее прямой; коэффициент для запасного варианта. */
const DETOUR = 1.3;

const EARTH_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Такси в Самарканде и Ташкенте: посадка около $0.6, дальше примерно $0.2
 * за километр, дешевле доллара поездок не бывает. Это оценка для планирования,
 * а не тариф службы.
 */
export function taxiFareUsd(km: number): number {
  return Math.max(1, Math.round((0.6 + 0.2 * km) * 10) / 10);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Соседние объекты стоят в сотне метров друг от друга, и «0 км» — это не
 * расстояние, а обидная бессмыслица. Ближние переходы меряем метрами.
 */
export function distanceLabel(km: number): { value: number; unit: 'm' | 'km' } {
  if (km < 1) return { value: Math.max(10, Math.round((km * 1000) / 10) * 10), unit: 'm' };
  return { value: round1(km), unit: 'km' };
}

/**
 * Способ выбираем по расстоянию, а время — по способу.
 *
 * Публичный OSRM отдаёт только автомобильный профиль (`/foot/` на нём —
 * тот же автомобиль, проверено: те же метры и секунды). Поэтому время
 * пешего перехода считаем сами по расстоянию, а машинное берём у OSRM.
 */
export function legFrom(km: number, drivingMinutes: number): RouteLeg {
  if (km <= WALK_MAX_KM) {
    return {
      km: round2(km),
      minutes: Math.max(1, Math.round((km / WALK_KMH) * 60)),
      mode: 'walk',
      fareUsd: 0,
    };
  }
  return {
    km: round2(km),
    minutes: Math.max(1, Math.round(drivingMinutes)),
    mode: 'taxi',
    fareUsd: taxiFareUsd(km),
  };
}

export function osrmUrl(points: LatLng[]): string {
  const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  return `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
}

type OsrmAnswer = {
  routes?: {
    geometry?: { coordinates?: [number, number][] };
    legs?: { distance?: number; duration?: number }[];
  }[];
};

/** Разбор ответа OSRM. null — ответ не годится, зовите запасной вариант. */
export function parseOsrm(
  json: unknown,
  expectedLegs: number,
): { line: [number, number][]; legs: RouteLeg[] } | null {
  const route = (json as OsrmAnswer)?.routes?.[0];
  const line = route?.geometry?.coordinates;
  const legs = route?.legs;
  if (!Array.isArray(line) || line.length < 2) return null;
  if (!Array.isArray(legs) || legs.length !== expectedLegs) return null;
  if (legs.some((leg) => typeof leg?.distance !== 'number' || typeof leg?.duration !== 'number')) {
    return null;
  }
  return {
    line,
    legs: legs.map((leg) => legFrom((leg.distance as number) / 1000, (leg.duration as number) / 60)),
  };
}

/** Запасной вариант: прямые отрезки с поправкой на то, что дорога длиннее. */
export function directRoute(points: LatLng[]): { line: [number, number][]; legs: RouteLeg[] } {
  const legs: RouteLeg[] = [];
  for (let i = 1; i < points.length; i++) {
    const km = haversineKm(points[i - 1], points[i]) * DETOUR;
    // без дорог машинное время оцениваем по 25 км/ч: городской трафик
    legs.push(legFrom(km, (km / 25) * 60));
  }
  return { line: points.map((p) => [p.lng, p.lat] as [number, number]), legs };
}

/** Итог дня одной строкой: сколько пешком и сколько на такси. */
export function routeTotals(legs: RouteLeg[]): {
  walkKm: number;
  walkMinutes: number;
  taxiUsd: number;
  taxiMinutes: number;
} {
  const walk = legs.filter((l) => l.mode === 'walk');
  const taxi = legs.filter((l) => l.mode === 'taxi');
  return {
    walkKm: round2(walk.reduce((s, l) => s + l.km, 0)),
    walkMinutes: walk.reduce((s, l) => s + l.minutes, 0),
    taxiUsd: round1(taxi.reduce((s, l) => s + l.fareUsd, 0)),
    taxiMinutes: taxi.reduce((s, l) => s + l.minutes, 0),
  };
}

/**
 * Сколько займёт день: осмотр плюс дорога между объектами.
 *
 * Турист планирует день целиком, а не по объектам: «влезет ли это до вечера»
 * — первый вопрос. Раньше на странице были время начала и длительность каждого
 * объекта по отдельности, и складывать их приходилось в уме.
 */
export function dayDuration(
  visitMinutes: number[],
  legs: RouteLeg[],
): { total: number; visit: number; travel: number } {
  const visit = visitMinutes.reduce((sum, m) => sum + m, 0);
  const travel = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  return { total: visit + travel, visit, travel };
}

/** «6 ч 40 мин» — часы и минуты, потому что «400 мин» никто не читает. */
export function hoursLabel(minutes: number, lang: 'uz' | 'ru' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hu = { uz: 'soat', ru: 'ч', en: 'h' }[lang];
  const mu = { uz: 'daq', ru: 'мин', en: 'min' }[lang];
  if (h === 0) return `${m} ${mu}`;
  if (m === 0) return `${h} ${hu}`;
  return `${h} ${hu} ${m} ${mu}`;
}

/**
 * Ссылка на Яндекс.Карты с этим же маршрутом: в поездке нужен навигатор
 * с голосом и пробками, а не картинка. В Узбекистане это Яндекс.
 */
export function navigatorUrl(points: LatLng[]): string {
  const rtext = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('~');
  return `https://yandex.uz/maps/?rtext=${rtext}&rtt=auto`;
}

/** Запрос к OSRM с запасным вариантом: пустой карты и молчания быть не должно. */
export async function fetchDayRoute(
  points: LatLng[],
  signal?: AbortSignal,
): Promise<{ line: [number, number][]; legs: RouteLeg[]; source: 'roads' | 'direct' }> {
  try {
    const response = await fetch(osrmUrl(points), { signal });
    if (!response.ok) throw new Error(String(response.status));
    const parsed = parseOsrm(await response.json(), points.length - 1);
    if (parsed) return { ...parsed, source: 'roads' };
  } catch {
    // сети нет или маршрутизатор молчит — ниже честные прямые
  }
  return { ...directRoute(points), source: 'direct' };
}
