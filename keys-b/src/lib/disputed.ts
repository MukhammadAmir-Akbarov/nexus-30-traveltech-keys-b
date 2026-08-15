import { DISPUTED, type DisputedTopic } from '../data/disputed.ts';
import { tokenize } from './retrieval.ts';
import type { Lang } from './types.ts';

// Поиск спорной темы работает так же, как предзаписанные вердикты: по набору
// обязательных слов после токенизации, поэтому одинаково ловит запрос
// на узбекском, русском и английском.

export function findDisputed(claim: string): DisputedTopic | null {
  const tokens = [...new Set(tokenize(claim))];
  const raw = claim.toLowerCase();
  // Сравниваем по началу слова, а не по точному совпадению: стеммер режет до
  // шести символов, и «Бухаре», «Бухара», «Buxoro» дают разные основы.
  const matches = (must: string) =>
    raw.includes(must) || tokens.some((t) => t.startsWith(must) || must.startsWith(t));
  return DISPUTED.find((topic) => topic.must.every(matches)) ?? null;
}

/** Готовый к отправке вид: тексты уже на языке интерфейса. */
export function disputedForLang(topic: DisputedTopic, lang: Lang) {
  return {
    question: topic.question[lang],
    note: topic.note[lang],
    positions: topic.positions.map((p) => ({
      claim: p.claim[lang],
      title: p.source.title[lang],
      url: p.source.url,
      tier: p.source.tier ?? 'secondary',
    })),
  };
}
