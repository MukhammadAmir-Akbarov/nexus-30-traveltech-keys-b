import { CORPUS } from '../data/corpus.ts';
import { PLACE_BY_ID } from '../data/places.ts';
import { tr } from './i18n.ts';
import type { I18nText, Lang, Place, Source } from './types.ts';

/**
 * Брифинг по объекту: что сказать туристу ДО того, как он войдёт.
 *
 * ГЛАВНОЕ ОГРАНИЧЕНИЕ. Брифинг не пишется — он собирается. Каждый факт берётся
 * из corpus.ts и приходит вместе со своим источником. Ничего нового здесь
 * не сочиняется: продукт, который ловит гида на непроверяемом утверждении,
 * не имеет права сам произносить непроверяемое. Нет в корпусе — нет в брифинге,
 * и тогда мы прямо говорим, что материала мало.
 *
 * Поэтому у функции нет ни модели, ни сети: это выборка из данных, и она
 * одинаково работает в самолёте, в подвале Ичан-Калы и на защите без вайфая.
 */

/** Сколько фактов помещается в брифинг «на входе»: больше — уже не брифинг. */
export const BRIEFING_FACTS = 5;

/** Ниже этого числа фактов честнее предупредить, чем делать вид, что материал есть. */
export const BRIEFING_THIN = 3;

export type BriefingFact = {
  id: string;
  text: string;
  source: Source;
  /** Спорная тема: источники расходятся, и это надо произнести вслух. */
  contested?: boolean;
};

export type Briefing = {
  place: Place;
  /** Заголовок и одна фраза о месте — из данных объекта, не из модели. */
  name: string;
  summary: string;
  facts: BriefingFact[];
  /** «Что вы здесь увидите» — внутренние объекты комплекса. */
  highlights: string[];
  /** Материала в корпусе мало: интерфейс обязан сказать это, а не молчать. */
  thin: boolean;
  /** Сколько минут закладывать на осмотр — из того же датасета, что маршрут. */
  visitMinutes: number;
};

/**
 * Спорные темы выносим вперёд: если источники расходятся, турист должен
 * услышать это до экскурсии, а не спорить с гидом после.
 */
function orderFacts(items: BriefingFact[]): BriefingFact[] {
  return [...items].sort((a, b) => Number(Boolean(b.contested)) - Number(Boolean(a.contested)));
}

export function briefingFor(placeId: string, lang: Lang): Briefing | null {
  const place = PLACE_BY_ID[placeId];
  if (!place) return null;

  const facts: BriefingFact[] = CORPUS.filter((item) => item.placeId === placeId).map((item) => ({
    id: item.id,
    // Корпус хранится на языке источника (русском) — это канон, его не переводим.
    // Переводить факт значит пересказывать его, а пересказ уже не источник.
    text: item.text,
    source: item.source,
  }));

  return {
    place,
    name: tr(place.name, lang),
    summary: tr(place.summary, lang),
    facts: orderFacts(facts).slice(0, BRIEFING_FACTS),
    highlights: (place.highlights ?? []).map((item: I18nText) => tr(item, lang)),
    thin: facts.length < BRIEFING_THIN,
    visitMinutes: place.visitMinutes,
  };
}
