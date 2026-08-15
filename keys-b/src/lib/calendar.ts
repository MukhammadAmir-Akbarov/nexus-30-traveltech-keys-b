import type { I18nText, Lang } from './types.ts';

/**
 * Сезонность, которая реально меняет поездку по Узбекистану.
 *
 * Рамадан и Навруз — не украшение календаря: в эти дни меняются часы работы
 * заведений, вечером у святынь многолюдно, а дневной осмотр в пост даётся
 * иначе. Для зиёрат-туризма это важнее погоды.
 *
 * Даты Рамадана лунные и сдвигаются примерно на 11 дней в год; приведённые
 * здесь — ориентировочные. Точное начало и конец объявляет Управление
 * мусульман Узбекистана, и в интерфейсе это сказано прямо.
 */

export type Season = 'ramadan' | 'eid' | 'navruz';

type Window = { season: Season; from: string; to: string };

/** Окна заданы датами включительно, в формате YYYY-MM-DD. */
const WINDOWS: Window[] = [
  // Рамадан и Ураза-байрам
  { season: 'ramadan', from: '2026-02-17', to: '2026-03-19' },
  { season: 'eid', from: '2026-03-20', to: '2026-03-22' },
  { season: 'ramadan', from: '2027-02-06', to: '2027-03-07' },
  { season: 'eid', from: '2027-03-08', to: '2027-03-10' },
  // Навруз — фиксированная дата, 21 марта, гуляния идут несколько дней
  { season: 'navruz', from: '2026-03-20', to: '2026-03-23' },
  { season: 'navruz', from: '2027-03-20', to: '2027-03-23' },
];

const NOTE: Record<Season, I18nText> = {
  ramadan: {
    uz: 'Ramazon oyi: kunduzi bir qism kafelar yopiq bo‘lishi mumkin, kechqurun ziyoratgohlarda gavjum. Aniq sanalarni O‘zbekiston musulmonlari idorasi e’lon qiladi.',
    ru: 'Рамадан: днём часть кафе может не работать, вечером у святынь многолюдно. Точные даты объявляет Управление мусульман Узбекистана.',
    en: 'Ramadan: some cafes may be closed during the day and shrines get crowded in the evening. Exact dates are announced by the Muslim Board of Uzbekistan.',
  },
  eid: {
    uz: 'Ramazon hayiti: bayram kunlari, ko‘p muassasalar qisqartirilgan jadvalda ishlaydi.',
    ru: 'Ураза-байрам: праздничные дни, многие учреждения работают по сокращённому графику.',
    en: 'Eid al-Fitr: public holidays, many institutions run a shortened schedule.',
  },
  navruz: {
    uz: 'Navro‘z: ommaviy sayllar, markaziy maydonlar gavjum, muassasalar qisqartirilgan jadvalda.',
    ru: 'Навруз: массовые гуляния, на центральных площадях многолюдно, учреждения по сокращённому графику.',
    en: 'Navruz: public celebrations, central squares are crowded, institutions run a shortened schedule.',
  },
};

/** Все сезоны, в которые попадает дата: в 2026-м Ураза-байрам и Навруз совпали. */
export function seasonsFor(date: string): Season[] {
  return [...new Set(WINDOWS.filter((w) => date >= w.from && date <= w.to).map((w) => w.season))];
}

/** Первый сезон даты — для правил, которым достаточно одного. */
export function seasonFor(date: string): Season | null {
  return seasonsFor(date)[0] ?? null;
}

/** Подпись для дня маршрута — или ничего, если день обычный. */
export function seasonNote(date: string, lang: Lang): string | null {
  const seasons = seasonsFor(date);
  if (seasons.length === 0) return null;
  return seasons.map((s) => NOTE[s][lang]).join(' ');
}

/**
 * В праздничные дни осмотр урезаем: учреждения работают короче, а на площадях
 * теснее. Коэффициент к дневному бюджету времени.
 */
export function seasonBudgetFactor(date: string): number {
  const season = seasonFor(date);
  if (season === 'eid' || season === 'navruz') return 0.75;
  return 1;
}
