import type { I18nText } from '../lib/types.ts';

/**
 * Реестр источников.
 *
 * Главное требование к продукту — не выдумывать факты. Технически это значит,
 * что у каждого изменчивого утверждения (часы работы, цена билета, адрес) есть
 * ссылка на то, откуда оно взято, и дата, когда его последний раз сверяли.
 * Строка URL, размазанная по датасету, этого не даёт: её нельзя ни проверить
 * скопом, ни показать туристу одинаково.
 *
 * Отдельный уровень `demo` заведён намеренно и честно: часть значений в
 * прототипе никем не сверялась. Прятать это за видом официального источника
 * было бы ровно тем, в чём продукт упрекает недобросовестного гида.
 */

export const SOURCE_IDS = [
  'unesco-samarkand',
  'unesco-bukhara',
  'unesco-khiva',
  'unesco-shakhrisabz',
  'uz-travel',
  'osm',
  'demo',
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

/**
 * `demo` — значение из датасета прототипа, никем не сверенное.
 * Интерфейс обязан показывать это прямо, а не выдавать за проверенное.
 */
export type SourceTierEx = 'official' | 'secondary' | 'demo';

// Не пересечение с Source: там tier — только official | secondary, а demo
// сознательно шире. Пересечение молча вычло бы новый уровень до пустого типа.
export type SourceMeta = { title: I18nText; url: string; tier: SourceTierEx };

export const SOURCES: Record<SourceId, SourceMeta> = {
  'unesco-samarkand': {
    title: {
      uz: 'YuNESKO: Samarqand — madaniyatlar chorrahasi',
      ru: 'ЮНЕСКО: Самарканд — перекрёсток культур',
      en: 'UNESCO: Samarkand — Crossroads of Cultures',
    },
    url: 'https://whc.unesco.org/en/list/603',
    tier: 'official',
  },
  'unesco-bukhara': {
    title: {
      uz: 'YuNESKO: Buxoro tarixiy markazi',
      ru: 'ЮНЕСКО: Исторический центр Бухары',
      en: 'UNESCO: Historic Centre of Bukhara',
    },
    url: 'https://whc.unesco.org/en/list/602',
    tier: 'official',
  },
  'unesco-khiva': {
    title: { uz: 'YuNESKO: Ichan Qal’a', ru: 'ЮНЕСКО: Ичан-Кала', en: 'UNESCO: Itchan Kala' },
    url: 'https://whc.unesco.org/en/list/543',
    tier: 'official',
  },
  'unesco-shakhrisabz': {
    title: {
      uz: 'YuNESKO: Shahrisabz tarixiy markazi',
      ru: 'ЮНЕСКО: Исторический центр Шахрисабза',
      en: 'UNESCO: Historic Centre of Shakhrisyabz',
    },
    url: 'https://whc.unesco.org/en/list/885',
    tier: 'official',
  },
  'uz-travel': {
    title: {
      uz: 'O‘zbekiston rasmiy turizm portali',
      ru: 'Официальный туристический портал Узбекистана',
      en: 'Official tourism portal of Uzbekistan',
    },
    url: 'https://uzbekistan.travel',
    tier: 'official',
  },
  osm: {
    title: {
      uz: 'OpenStreetMap — ochiq xarita ma’lumotlari',
      ru: 'OpenStreetMap — открытые картографические данные',
      en: 'OpenStreetMap — open map data',
    },
    url: 'https://www.openstreetmap.org',
    tier: 'secondary',
  },
  demo: {
    title: {
      uz: 'Prototip ma’lumotlari — tekshirilmagan',
      ru: 'Данные прототипа — не сверялись',
      en: 'Prototype dataset — unverified',
    },
    url: 'https://uzbekistan.travel',
    tier: 'demo',
  },
};

/**
 * Значение вместе с тем, откуда оно и когда сверялось.
 *
 * `at` необязателен и это не небрежность: его отсутствие — содержательный
 * ответ «никогда не сверяли», и интерфейс показывает именно его, а не
 * подставляет сегодняшнюю дату.
 */
export type Sourced<T> = {
  value: T;
  src: SourceId;
  /** Дата сверки, YYYY-MM-DD. Нет — значение не проверялось. */
  at?: string;
};

/** Насколько значению можно верить сегодня. */
export type Freshness = 'unverified' | 'fresh' | 'aging' | 'stale';

/** Дольше этого срока цена и часы работы устаревают настолько, что о них надо предупредить. */
const FRESH_DAYS = 30;
const AGING_DAYS = 180;

export function freshnessOf(entry: { src: SourceId; at?: string }, now = Date.now()): Freshness {
  if (SOURCES[entry.src].tier === 'demo' || !entry.at) return 'unverified';
  const checked = new Date(entry.at).getTime();
  if (Number.isNaN(checked)) return 'unverified';
  const days = (now - checked) / 86_400_000;
  if (days <= FRESH_DAYS) return 'fresh';
  if (days <= AGING_DAYS) return 'aging';
  return 'stale';
}

export const FRESHNESS_LABEL: Record<Freshness, I18nText> = {
  unverified: {
    uz: 'tekshirilmagan',
    ru: 'не сверялось',
    en: 'unverified',
  },
  fresh: {
    uz: 'yaqinda yangilangan',
    ru: 'недавно сверено',
    en: 'recently checked',
  },
  aging: {
    uz: 'ancha oldin yangilangan',
    ru: 'сверялось давно',
    en: 'checked a while ago',
  },
  stale: {
    uz: 'eskirgan — joyida aniqlang',
    ru: 'устарело — уточняйте на месте',
    en: 'out of date — confirm on site',
  },
};
