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
 * Накопленное при работе. Приходит снаружи, а не импортируется здесь:
 * `store.ts` тянет `node:fs` и алиасы `@/`, а этот модуль обязан оставаться
 * чистым — его грузит `npm run check` без сборщика.
 */
export type RuntimeRefs = {
  guideIds: string[];
  verdicts: { id: string; guideId: string; placeId?: string }[];
  requests: { id: string; kind: string; targetId: string }[];
  users: { email: string; guideId?: string }[];
  /** Ключи счётчиков репутации: `guideId` и `guideId|placeId`. */
  accuracyKeys: string[];
};

/**
 * Все висячие ссылки между таблицами. Пусто — база связна.
 *
 * Без аргумента проверяется только то, что лежит в коде. С аргументом —
 * ещё и накопленное: вердикт про удалённого гида, заявка на несуществующий
 * объект, аккаунт, привязанный в никуда. Раньше это было слепое пятно:
 * администратор удаляет гида, а его вердикты и счётчики остаются висеть.
 *
 * Зовётся из самопроверки и со страницы «Схема данных» в админке — там
 * результат видно глазами, а не только в консоли.
 */
export function danglingRefs(runtime?: RuntimeRefs): string[] {
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

  if (!runtime) return problems;

  const knownGuide = new Set(runtime.guideIds);
  for (const verdict of runtime.verdicts) {
    if (!knownGuide.has(verdict.guideId)) {
      problems.push(`вердикт ${verdict.id}: нет гида ${verdict.guideId}`);
    }
    if (verdict.placeId && !knownPlace(verdict.placeId)) {
      problems.push(`вердикт ${verdict.id}: нет объекта ${verdict.placeId}`);
    }
  }
  for (const request of runtime.requests) {
    const ok =
      request.kind === 'guide-booking'
        ? knownGuide.has(request.targetId)
        : knownPlace(request.targetId);
    if (!ok) problems.push(`заявка ${request.id}: нет цели ${request.targetId}`);
  }
  for (const user of runtime.users) {
    if (user.guideId && !knownGuide.has(user.guideId)) {
      problems.push(`аккаунт ${user.email}: нет гида ${user.guideId}`);
    }
  }
  for (const key of runtime.accuracyKeys) {
    const [guideId, placeId] = key.split('|');
    if (!knownGuide.has(guideId)) problems.push(`счётчик ${key}: нет гида ${guideId}`);
    if (placeId && !knownPlace(placeId)) problems.push(`счётчик ${key}: нет объекта ${placeId}`);
  }
  return problems;
}

/** Сводка по таблицам для страницы «Схема данных»: что есть и сколько строк. */
export function tableSummary(): { table: string; rows: number; source: 'код' | 'накопленное' }[] {
  return [
    { table: 'places', rows: PLACES.length, source: 'код' },
    { table: 'corpus', rows: CORPUS.length, source: 'код' },
    { table: 'photos', rows: Object.keys(PHOTOS).length, source: 'код' },
    { table: 'pois', rows: POIS.length, source: 'код' },
    { table: 'guides (посев)', rows: GUIDES.length, source: 'код' },
  ];
}
