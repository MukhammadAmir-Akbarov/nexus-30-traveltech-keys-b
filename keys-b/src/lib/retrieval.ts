import type { CorpusItem } from './types.ts';

// Поиск по корпусу без эмбеддингов и без БД.
// ponytail: 40 абзацев -> хватает IDF по префиксам слов; при корпусе >500 абзацев
// менять на Postgres + pgvector (интерфейс retrieve() останется тем же).

const STOPWORDS = new Set([
  'это', 'что', 'как', 'для', 'при', 'над', 'под', 'без', 'the', 'and',
  'был', 'была', 'было', 'были', 'его', 'её', 'их', 'там', 'тут', 'где',
  'или', 'если', 'чем', 'уже', 'ещё', 'все', 'всё', 'так', 'году', 'года',
  'was', 'were', 'built', 'is', 'in', 'of', 'qurilgan', 'nechanchi', 'yilda',
]);

/**
 * Корпус хранится по-русски (язык источника), а спрашивать могут на узбекском
 * или английском. Приводим латинские названия объектов к кириллическим токенам —
 * этого хватает, потому что имена собственные и есть носители смысла запроса.
 * ponytail: словарь на ~30 записей вместо мультиязычных эмбеддингов;
 * расширять по мере роста корпуса.
 */
const ALIASES: Record<string, string> = {
  registon: 'регистан', registan: 'регистан', registonda: 'регистан',
  samarqand: 'самарканд', samarkand: 'самарканд',
  buxoro: 'бухара', bukhara: 'бухара',
  xiva: 'хива', khiva: 'хива',
  toshkent: 'ташкент', tashkent: 'ташкент',
  shahrisabz: 'шахрисабз', shakhrisabz: 'шахрисабз',
  kalon: 'калян', kalyan: 'калян', kalta: 'кальта',
  minor: 'минарет', minora: 'минарет', minaret: 'минарет',
  ichan: 'ичан', itchan: 'ичан',
  madrasa: 'медресе', madrasah: 'медресе', masjid: 'мечеть', mosque: 'мечеть',
  maqbara: 'мавзолей', mausoleum: 'мавзолей',
  ulugbek: 'улугбек', ulugh: 'улугбек',
  rasadxona: 'обсерватория', observatory: 'обсерватория',
  temur: 'темур', timur: 'темур',
  unesco: 'юнеско', yunesko: 'юнеско',
  balandligi: 'высота', height: 'высота', asr: 'век', century: 'век',
  // без этой пары «первый объект ЮНЕСКО» находился только по-русски,
  // а на узбекском и английском тот же пример отвечал «нет данных»
  birinchi: 'первый', first: 'первый',
  // возраст города и имена, по которым ищутся спорные темы
  yosh: 'лет', yoshda: 'лет', age: 'лет', old: 'лет', years: 'лет', yil: 'лет',
  bibixonim: 'биби', bibi: 'биби', bibixonym: 'биби',
  qurdirgan: 'построен', built: 'построен', qurilgan: 'построен',
  bozor: 'базар', bazaar: 'базар',
  somoniylar: 'саманиды', samanid: 'саманиды',
  oqsaroy: 'сарай', saray: 'сарай',
  aydarkol: 'айдаркуль', aydarkul: 'айдаркуль',
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[’'`]/g, '')
    .replace(/[^a-zа-я0-9-]+/gi, ' ')
    .trim();
}

/** Грубый стеммер: обрезаем слово до 6 символов. «регистане» и «регистан» -> «регист». */
function stem(token: string): string {
  return token.length > 6 ? token.slice(0, 6) : token;
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s-]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map((t) => ALIASES[t] ?? t)
    .map(stem);
}

export type Hit = { item: CorpusItem; score: number };

export function retrieve(corpus: CorpusItem[], query: string, k = 3): Hit[] {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) return [];

  const docs = corpus.map((item) => ({
    item,
    text: new Set(tokenize(item.text)),
    keywords: new Set(item.keywords.flatMap(tokenize)),
  }));

  const df = new Map<string, number>();
  for (const token of queryTokens) {
    const count = docs.filter((d) => d.text.has(token) || d.keywords.has(token)).length;
    df.set(token, count);
  }

  const hits: Hit[] = docs.map((doc) => {
    let score = 0;
    for (const token of queryTokens) {
      const hitsInDoc = df.get(token) ?? 0;
      if (hitsInDoc === 0) continue;
      const idf = Math.log(1 + corpus.length / hitsInDoc);
      if (doc.keywords.has(token)) score += idf * 1.6;
      else if (doc.text.has(token)) score += idf;
    }
    return { item: doc.item, score: score / Math.sqrt(queryTokens.length) };
  });

  return hits
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
