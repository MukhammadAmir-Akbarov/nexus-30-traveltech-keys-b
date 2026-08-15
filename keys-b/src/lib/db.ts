/**
 * Одна база на весь проект: единственная точка входа ко всем данным.
 *
 * Данные лежали в восьми файлах `data/*` и в `store.ts`, связи между ними
 * держались в голове и в отдельных `.filter()` по разным страницам. Здесь всё
 * это собрано вместе, а связи названы явно.
 *
 * ─── Что с чем связано ───────────────────────────────────────────────────
 *
 *   place ──┬── corpus.placeId      факты об объекте
 *           ├── photo[placeId]      снимок с Викисклада, автор и лицензия
 *           ├── poi (по координатам) заправки, туалеты, намазхона рядом
 *           └── verdict.placeId     где прозвучало проверенное утверждение
 *
 *   guide ──┬── verdict.guideId     что гид говорил и чем это кончилось
 *           ├── accuracy[guideId]   счётчики проверок = репутация
 *           ├── user.guideId        аккаунт гида для кабинета
 *           └── request.targetId    заявки туристов (kind = guide-booking)
 *
 *   corpus ─── source.tier          официальный или вторичный источник
 *
 * Правило одно: **никаких висячих ссылок**. Каждый `placeId` в корпусе,
 * фотографиях и вердиктах обязан существовать среди объектов; каждый
 * `guideId` — среди гидов. Это не пожелание, а проверка в `npm run check`:
 * стоит добавить факт про несуществующий объект — тест падает.
 *
 * Что здесь read-only, а что меняется:
 *   - `data/*` — посев, лежит в коде и правится через репозиторий;
 *   - `store.ts` — то, что накопилось при работе (проверки, заявки, аккаунты),
 *     живёт в памяти процесса и переживает перезапуск в JSON на диске.
 * Наружу и то и другое отдаётся через этот модуль, чтобы страницы не знали,
 * где именно что лежит.
 */

import { CORPUS } from '../data/corpus.ts';
import { GUIDES } from '../data/guides.ts';
import { PLACES } from '../data/places.ts';
import { PHOTOS, type Photo } from '../data/photos.ts';
import { POIS } from '../data/poi.ts';
import { nearestPois, type NearbyPoi } from './poi.ts';
import { officialFactsFor } from './sources.ts';
import type { CorpusItem, Guide, Place, PoiKind } from './types.ts';

// ── Объекты ───────────────────────────────────────────────────────────────

export const places = (): Place[] => PLACES;

const PLACE_INDEX = new Map(PLACES.map((place) => [place.id, place]));
export const place = (id: string): Place | undefined => PLACE_INDEX.get(id);

/** Факты об объекте из корпуса — то, на что опирается проверка. */
export const factsFor = (placeId: string): CorpusItem[] =>
  CORPUS.filter((item) => item.placeId === placeId);

/** Сколько фактов об объекте пришло из официальных источников. */
export const officialFacts = (placeId: string) => officialFactsFor(CORPUS, placeId);

export const photo = (placeId: string): Photo | undefined => PHOTOS[placeId];

/** Инфраструктура рядом с объектом: заправки, туалеты, намазхона, кафе. */
export const poisNear = (point: Place, kinds?: PoiKind[]): NearbyPoi[] =>
  nearestPois(POIS, point, kinds);

// ── Гиды ──────────────────────────────────────────────────────────────────

const GUIDE_INDEX = new Map(GUIDES.map((guide) => [guide.id, guide]));

/** Посев гидов. Правки администратора живут в store — см. `getGuides()`. */
export const seedGuides = (): Guide[] => GUIDES;
export const seedGuide = (id: string): Guide | undefined => GUIDE_INDEX.get(id);

// ── Корпус ────────────────────────────────────────────────────────────────

export const corpus = (): CorpusItem[] => CORPUS;

// ── Целостность ───────────────────────────────────────────────────────────

/**
 * Все висячие ссылки между таблицами. Пусто — база связна.
 *
 * Зовётся из самопроверки: добавили факт про несуществующий объект или
 * фотографию неизвестно чего — узнаём об этом на `npm run check`, а не
 * на пустой странице во время показа.
 */
export function danglingRefs(): string[] {
  const problems: string[] = [];
  const knownPlace = (id: string) => PLACE_INDEX.has(id);

  for (const item of CORPUS) {
    if (item.placeId && !knownPlace(item.placeId)) {
      problems.push(`корпус ${item.id}: нет объекта ${item.placeId}`);
    }
  }
  for (const id of Object.keys(PHOTOS)) {
    if (!knownPlace(id)) problems.push(`фотография: нет объекта ${id}`);
  }
  for (const guide of GUIDES) {
    for (const region of guide.regions) {
      if (!PLACES.some((p) => p.region === region)) {
        problems.push(`гид ${guide.id}: в регионе ${region} нет ни одного объекта`);
      }
    }
  }
  return problems;
}
