import type { Budget, I18nText, Lang } from './types.ts';

/**
 * Бюджет поездки — тот же вопрос, что задаёт мобильное приложение SafarAI:
 * «Odatdagi budjetingiz?» с тремя уровнями в сумах на день.
 *
 * Он не косметический. Ответ меняет три вещи:
 *  - какой вариант переезда предлагается первым (дешёвый или быстрый);
 *  - как считаются очки объекта: экономному дорогой билет мешает, премиуму нет;
 *  - предупреждение, когда день по билетам вылезает за дневной потолок.
 *
 * Пороги в сумах, потому что турист внутри страны думает в сумах. Курс —
 * ориентировочный и подписан в интерфейсе: точный курс — дело ЦБ, а не наше.
 */

/** Ориентировочный курс на август 2026. Меняется — правится здесь одним числом. */
export const UZS_PER_USD = 12_600;

export const BUDGET_LEVELS: Budget[] = ['low', 'mid', 'high'];

/** Верхняя граница дневных трат, сум. У премиума потолка нет. */
const CAP_UZS: Record<Budget, number> = {
  low: 300_000,
  mid: 900_000,
  high: Number.POSITIVE_INFINITY,
};

export const BUDGET_LABEL: Record<Budget, I18nText> = {
  low: { uz: 'Tejamkor', ru: 'Экономный', en: 'Budget' },
  mid: { uz: 'O‘rtacha', ru: 'Средний', en: 'Mid-range' },
  high: { uz: 'Premium', ru: 'Премиум', en: 'Premium' },
};

export const BUDGET_DESC: Record<Budget, I18nText> = {
  low: {
    uz: 'Xostel, jamoat transporti, mahalliy oshxonalar',
    ru: 'Хостел, общественный транспорт, местные столовые',
    en: 'Hostel, public transport, local canteens',
  },
  mid: {
    uz: '3–4 yulduzli mehmonxona, gid, restoranlar',
    ru: 'Отель 3–4 звезды, гид, рестораны',
    en: '3–4 star hotel, a guide, restaurants',
  },
  high: {
    uz: 'Butik mehmonxona, shaxsiy gid, transfer',
    ru: 'Бутик-отель, личный гид, трансфер',
    en: 'Boutique hotel, private guide, transfers',
  },
};

export const BUDGET_PRICE: Record<Budget, I18nText> = {
  low: { uz: '300k so‘mgacha', ru: 'до 300 тыс. сум', en: 'up to 300k UZS' },
  mid: { uz: '300k – 900k', ru: '300–900 тыс. сум', en: '300k – 900k UZS' },
  high: { uz: '900k+', ru: 'от 900 тыс. сум', en: '900k+ UZS' },
};

/** Дневной потолок в долларах: билеты и дорога считаются в них. */
export function dailyCapUsd(budget: Budget): number {
  const cap = CAP_UZS[budget];
  return cap === Number.POSITIVE_INFINITY ? cap : Math.round(cap / UZS_PER_USD);
}

/**
 * День вылез за потолок — об этом надо сказать, а не молча оставить в плане.
 *
 * Потолок назван на одного человека, а траты дня считаются на всех сразу,
 * поэтому его умножаем: иначе семья из четверых получала предупреждение
 * на каждом дне просто за то, что их четверо.
 */
export function overBudget(
  dayUsd: number,
  budget: Budget | undefined,
  travelers = 1,
): boolean {
  if (!budget) return false;
  return dayUsd > dailyCapUsd(budget) * Math.max(1, travelers);
}

/**
 * Поправка к очкам объекта за цену билета.
 *
 * Экономному дорогой билет мешает, но не запрещает: Регистан за $5 — это
 * то, ради чего человек приехал, и выкидывать его из-за бюджета нельзя.
 * Поэтому поправка маленькая и решает только споры равных.
 */
export function budgetScoreBonus(ticketUsd: number | undefined, budget: Budget | undefined): number {
  if (!budget) return 0;
  const price = ticketUsd ?? 0;
  if (budget === 'low') return price === 0 ? 1 : -Math.min(1.5, price * 0.2);
  if (budget === 'high') return price > 0 ? 0.3 : 0;
  return 0;
}

/** Сумма прописью для интерфейса: «≈ 63 000 сум». */
export function usdToUzsLabel(usd: number, lang: Lang): string {
  const uzs = Math.round((usd * UZS_PER_USD) / 1000) * 1000;
  const grouped = uzs.toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU');
  const unit = lang === 'ru' ? 'сум' : lang === 'en' ? 'UZS' : 'so‘m';
  return `${grouped} ${unit}`;
}
