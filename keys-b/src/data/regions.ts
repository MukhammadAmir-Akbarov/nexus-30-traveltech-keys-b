import type { I18nText } from '../lib/types.ts';

/**
 * Реестр регионов и городов — единственный источник правды по географии.
 *
 * Раньше добавление области означало правку шести файлов: union в types.ts,
 * REGION_LABEL в i18n, REGION_NAME в planner, три таблицы в climate.ts и
 * направления в transfer.ts. Забыть одну — значит получить регион, который
 * выбирается в интерфейсе, но не имеет ни погоды, ни названия на карте.
 * Теперь новая область — это одна запись здесь, а Record<Region, …> ниже
 * не даст собрать проект, пока она не заполнена целиком.
 *
 * Два уровня, а не один: «Хорезм» — это область, а Хива — город в ней.
 * Турист прилетает в Ургенч и едет в Хиву 35 км; модель, где регион равен
 * городу, этот отрезок просто теряет, и план поездки врёт с первого шага.
 */

// --- регионы ---

/** Порядок важен: он же порядок выбора в интерфейсе. */
export const REGION_IDS = [
  'tashkent',
  'samarkand',
  'bukhara',
  'khorezm',
  'shakhrisabz',
  'nurata',
] as const;

export type Region = (typeof REGION_IDS)[number];

export type RegionMeta = {
  name: I18nText;
  /** Центр области — по нему запрашивается прогноз погоды. */
  center: { lat: number; lng: number };
  /** Средний максимум температуры по месяцам, °C. Индекс 0 — январь. */
  tmax: number[];
  /** Осадки, мм в месяц. Летом в Узбекистане их практически нет. */
  precip: number[];
  cities: CityId[];
  /**
   * Город, через который в область реально приезжают: аэропорт или вокзал.
   * Для Хорезма это Ургенч, а не Хива — рейсы и поезда приходят туда.
   */
  gateway: CityId;
  /** Точка входа в страну: сюда прилетают и отсюда улетают. */
  entry?: boolean;
};

export const REGIONS: Record<Region, RegionMeta> = {
  tashkent: {
    name: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    center: { lat: 41.311, lng: 69.24 },
    tmax: [8, 10, 16, 23, 29, 34, 36, 35, 30, 22, 15, 10],
    precip: [55, 55, 70, 65, 35, 8, 4, 2, 5, 30, 50, 55],
    cities: ['tashkent'],
    gateway: 'tashkent',
    entry: true,
  },
  samarkand: {
    name: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
    center: { lat: 39.654, lng: 66.976 },
    tmax: [7, 9, 15, 21, 27, 33, 35, 34, 29, 21, 14, 9],
    precip: [40, 45, 65, 60, 35, 8, 3, 1, 4, 25, 40, 45],
    cities: ['samarkand'],
    gateway: 'samarkand',
  },
  bukhara: {
    name: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
    center: { lat: 39.775, lng: 64.423 },
    tmax: [8, 11, 17, 24, 30, 35, 37, 35, 30, 23, 16, 10],
    precip: [25, 25, 35, 25, 12, 3, 2, 1, 2, 10, 20, 25],
    cities: ['bukhara'],
    gateway: 'bukhara',
  },
  khorezm: {
    // Область, а не город: Хива — её центр для туриста, Ургенч — ворота.
    name: { uz: 'Xorazm', ru: 'Хорезм', en: 'Khorezm' },
    center: { lat: 41.378, lng: 60.363 },
    tmax: [4, 7, 14, 23, 30, 35, 37, 35, 29, 21, 13, 7],
    precip: [15, 15, 20, 15, 8, 3, 3, 2, 3, 8, 15, 18],
    cities: ['khiva', 'urgench'],
    gateway: 'urgench',
  },
  shakhrisabz: {
    name: { uz: 'Shahrisabz', ru: 'Шахрисабз', en: 'Shakhrisabz' },
    center: { lat: 39.057, lng: 66.83 },
    tmax: [8, 10, 16, 22, 28, 34, 36, 35, 30, 22, 15, 10],
    precip: [45, 50, 70, 60, 35, 8, 3, 1, 4, 25, 45, 50],
    cities: ['shakhrisabz'],
    gateway: 'shakhrisabz',
  },
  nurata: {
    name: { uz: 'Nurota / Aydarko‘l', ru: 'Нурата / Айдаркуль', en: 'Nurata / Aydarkul' },
    center: { lat: 40.56, lng: 65.687 },
    tmax: [7, 10, 16, 23, 29, 34, 36, 34, 29, 22, 15, 9],
    precip: [30, 30, 45, 35, 20, 5, 2, 1, 3, 15, 25, 30],
    cities: ['nurata'],
    gateway: 'nurata',
  },
};

// --- города ---

export const CITY_IDS = [
  'tashkent',
  'samarkand',
  'bukhara',
  'khiva',
  'urgench',
  'shakhrisabz',
  'nurata',
] as const;

export type CityId = (typeof CITY_IDS)[number];

export type CityMeta = {
  region: Region;
  name: I18nText;
  lat: number;
  lng: number;
  /** Чем город принимает приезжих: самолёт, поезд или и то и другое. */
  arrivesBy?: 'air' | 'rail' | 'both';
};

export const CITIES: Record<CityId, CityMeta> = {
  tashkent: {
    region: 'tashkent',
    name: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    lat: 41.311,
    lng: 69.24,
    arrivesBy: 'both',
  },
  samarkand: {
    region: 'samarkand',
    name: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
    lat: 39.654,
    lng: 66.976,
    arrivesBy: 'both',
  },
  bukhara: {
    region: 'bukhara',
    name: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
    lat: 39.775,
    lng: 64.423,
    arrivesBy: 'both',
  },
  khiva: {
    region: 'khorezm',
    name: { uz: 'Xiva', ru: 'Хива', en: 'Khiva' },
    lat: 41.378,
    lng: 60.363,
    // своего аэропорта и вокзала нет: приезжают через Ургенч
  },
  urgench: {
    region: 'khorezm',
    name: { uz: 'Urganch', ru: 'Ургенч', en: 'Urgench' },
    lat: 41.55,
    lng: 60.631,
    arrivesBy: 'both',
  },
  shakhrisabz: {
    region: 'shakhrisabz',
    name: { uz: 'Shahrisabz', ru: 'Шахрисабз', en: 'Shakhrisabz' },
    lat: 39.057,
    lng: 66.83,
    arrivesBy: 'rail',
  },
  nurata: {
    region: 'nurata',
    name: { uz: 'Nurota', ru: 'Нурата', en: 'Nurata' },
    lat: 40.56,
    lng: 65.687,
  },
};

// --- производные ---

/** Точка входа в страну: сюда прилетают и отсюда улетают. */
export const ENTRY_REGION: Region =
  (REGION_IDS.find((id) => REGIONS[id].entry) as Region | undefined) ?? 'tashkent';

export const REGION_LABEL: Record<Region, I18nText> = Object.fromEntries(
  REGION_IDS.map((id) => [id, REGIONS[id].name]),
) as Record<Region, I18nText>;

export const CITY_LABEL: Record<CityId, I18nText> = Object.fromEntries(
  CITY_IDS.map((id) => [id, CITIES[id].name]),
) as Record<CityId, I18nText>;

export function citiesOf(region: Region): CityId[] {
  return REGIONS[region].cities;
}

/**
 * Переименования регионов между версиями. Нужны ровно там, где данные
 * пережили выпуск: снимок хранилища на диске и ссылка «поделиться поездкой»
 * в чужой переписке. Без этой таблицы гид с регионом `khiva` после
 * переименования просто перестаёт находиться — молча.
 */
const RENAMED: Record<string, Region> = { khiva: 'khorezm' };

/** Приводит сохранённый идентификатор региона к текущему или отдаёт null. */
export function normalizeRegion(value: unknown): Region | null {
  if (typeof value !== 'string') return null;
  if ((REGION_IDS as readonly string[]).includes(value)) return value as Region;
  return RENAMED[value] ?? null;
}
