import type { CorpusItem } from './types.ts';

/**
 * Сколько у объекта фактов из официальных источников.
 *
 * У приложения-конкурента значок «Проверено» декларативный — просто галочка.
 * У нас за ним стоит счёт: сколько абзацев корпуса про этот объект пришло
 * из официальных источников (ЮНЕСКО, министерства, музеи), а сколько —
 * из вторичных. Значок обязан опираться на это число, а не на желание
 * показать галочку.
 */
export function officialFactsFor(corpus: CorpusItem[], placeId: string): {
  official: number;
  total: number;
} {
  const mine = corpus.filter((item) => item.placeId === placeId);
  return {
    official: mine.filter((item) => item.source.tier === 'official').length,
    total: mine.length,
  };
}
