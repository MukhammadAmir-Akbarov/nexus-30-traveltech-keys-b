import { tokenize } from './retrieval.ts';
import type { Interest, Region, TravelType, TripContext } from './types.ts';

/**
 * Разбор фразы вида «хочу в Самарканд на три дня, интересует история».
 *
 * Распознавание речи уже работает на проверке фактов; здесь — только разбор
 * текста. Модель не нужна: набор регионов, интересов и форматов закрытый,
 * а числительные до четырнадцати перечислимы. Разбор чистый и проверяется
 * тестом, поэтому его поведение предсказуемо и на демо не подведёт.
 *
 * Работает на трёх языках: слова приводятся тем же токенизатором с латинско-
 * кириллическими алиасами, что и поиск по корпусу.
 */

const REGION_WORDS: Record<Region, string[]> = {
  samarkand: ['самарканд'],
  bukhara: ['бухара', 'бухар'],
  khiva: ['хива', 'хиве', 'хиву'],
  tashkent: ['ташкент'],
  shakhrisabz: ['шахрисабз'],
  nurata: ['нурата', 'нурату', 'айдаркуль'],
};

const INTEREST_WORDS: Record<Interest, string[]> = {
  history: ['история', 'истори', 'tarix', 'history'],
  architecture: ['архитектура', 'архите', 'memorchilik', 'architecture'],
  religion: ['святыни', 'святын', 'ziyorat', 'зиярат', 'мечеть', 'религи'],
  nature: ['природа', 'природ', 'tabiat', 'nature', 'горы', 'озеро'],
  food: ['еда', 'кухня', 'плов', 'taom', 'food'],
  crafts: ['ремесло', 'ремесл', 'керамика', 'hunarm', 'crafts'],
  photo: ['фото', 'foto', 'photo'],
};

const TYPE_WORDS: Record<TravelType, string[]> = {
  family: ['семья', 'семьей', 'семьёй', 'детьми', 'oila', 'family'],
  group: ['группа', 'группой', 'guruh', 'group'],
  couple: [
    'вдвоем', 'вдвоём', 'пара', 'парой', 'женой', 'мужем', 'девушкой', 'парнем',
    'er-xotin', 'juftlik', 'ikkimiz', 'couple', 'honeymoon',
  ],
  solo: ['один', 'одна', 'соло', 'yakka', 'solo'],
};

/** Числительные словами: цифры ловятся отдельно регуляркой. */
const NUMBER_WORDS: Record<string, number> = {
  один: 1, одну: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7,
  восемь: 8, девять: 9, десять: 10,
  bir: 1, ikki: 2, uch: 3, tort: 4, besh: 5, olti: 6, yetti: 7,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
};

const MAX_DAYS = 14;

export type VoiceTripResult = Partial<
  Pick<TripContext, 'regions' | 'region' | 'interests' | 'travelType' | 'days'>
>;

/** Совпадение по началу слова: стеммер режет до шести символов. */
function has(tokens: string[], raw: string, words: string[]): boolean {
  return words.some(
    (w) => raw.includes(w) || tokens.some((t) => t.startsWith(w) || w.startsWith(t)),
  );
}

export function parseTripPhrase(phrase: string): VoiceTripResult {
  const raw = phrase.toLowerCase();
  const tokens = tokenize(phrase);
  const result: VoiceTripResult = {};

  const regions = (Object.keys(REGION_WORDS) as Region[]).filter((r) =>
    has(tokens, raw, REGION_WORDS[r]),
  );
  if (regions.length) {
    result.regions = regions;
    result.region = regions.length === 1 ? regions[0] : 'all';
  }

  const interests = (Object.keys(INTEREST_WORDS) as Interest[]).filter((i) =>
    has(tokens, raw, INTEREST_WORDS[i]),
  );
  if (interests.length) result.interests = interests;

  // Формат ищем в порядке убывания специфичности: «с семьёй» важнее «один».
  // «Вдвоём» стоит раньше «solo» намеренно: во фразе «едем вдвоём, я и жена»
  // иначе сработало бы «я» и пара превратилась бы в одиночку.
  const type = (['family', 'group', 'couple', 'solo'] as TravelType[]).find((t) =>
    has(tokens, raw, TYPE_WORDS[t]),
  );
  if (type) result.travelType = type;

  const digits = raw.match(/\b(\d{1,2})\b/);
  const days = digits
    ? Number(digits[1])
    : Object.entries(NUMBER_WORDS).find(([word]) => raw.includes(word))?.[1];
  if (days && days >= 1 && days <= MAX_DAYS) result.days = days;

  return result;
}
