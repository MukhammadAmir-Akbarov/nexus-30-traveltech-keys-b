import type { DayHours, OpeningHours } from './types.ts';

/**
 * Разбор строки opening_hours из OpenStreetMap.
 *
 * Формат описывает почти всё на свете — праздники, «последний вторник месяца»,
 * сезоны, восход солнца. Полная его поддержка — отдельная библиотека, и она
 * здесь не окупается: в наших пяти городах 151 запись, и подавляющее
 * большинство — это «24/7» или «Mo-Sa 09:00-18:00».
 *
 * Поэтому правило простое: разбираем то, что понимаем уверенно, а всё
 * остальное оставляем строкой и показываем как есть. Показать исходную
 * запись точнее, чем показать неправильно разобранную, — а тихо
 * ошибиться в часах работы аптеки хуже, чем не знать их.
 */

/** Индексы как у Date.getDay: 0 — воскресенье. */
const DAY_INDEX: Record<string, number> = {
  su: 0,
  mo: 1,
  tu: 2,
  we: 3,
  th: 4,
  fr: 5,
  sa: 6,
};

const ORDER = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

function minutes(value: string): number | null {
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

/** «Mo-Fr» и «Mo,We,Fr» — в список индексов дней. */
function daysOf(spec: string): number[] | null {
  const out = new Set<number>();
  for (const part of spec.split(',')) {
    const token = part.trim().toLowerCase();
    const range = token.match(/^([a-z]{2})-([a-z]{2})$/);
    if (range) {
      const from = ORDER.indexOf(range[1]);
      const to = ORDER.indexOf(range[2]);
      if (from < 0 || to < 0) return null;
      // диапазон может перехлёстывать неделю: Sa-Mo
      for (let i = from; ; i = (i + 1) % ORDER.length) {
        out.add(DAY_INDEX[ORDER[i]]);
        if (i === to) break;
      }
      continue;
    }
    if (token in DAY_INDEX) {
      out.add(DAY_INDEX[token]);
      continue;
    }
    return null;
  }
  return [...out];
}

/**
 * Часы работы из строки OSM. `null` — разобрать уверенно не удалось,
 * и вызывающий обязан показать исходную строку.
 */
export function parseOsmHours(raw: string): OpeningHours | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  if (value === '24/7') {
    const all: DayHours = { opens: 0, closes: 24 * 60 };
    return { week: Array.from({ length: 7 }, () => ({ ...all })) };
  }

  // Диапазоны дат, праздники и «по договорённости» — не наш случай.
  if (/ph|su\[|week|easter|sunrise|sunset|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/.test(value)) {
    return null;
  }

  const week: (DayHours | null)[] = Array.from({ length: 7 }, () => null);
  let matched = false;

  for (const clause of value.split(';')) {
    const text = clause.trim();
    if (!text) continue;

    const m = text.match(/^([a-z,\-]+)\s+(.+)$/);
    if (!m) return null;

    const days = daysOf(m[1]);
    if (!days) return null;

    const timePart = m[2].trim();
    if (timePart === 'off' || timePart === 'closed') {
      for (const day of days) week[day] = null;
      matched = true;
      continue;
    }

    // из нескольких интервалов берём первый и последний: обеденный перерыв
    // в дневном плане роли не играет, а границы дня — играют
    const spans = timePart.split(',').map((s) => s.trim());
    const first = spans[0].match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    const last = spans[spans.length - 1].match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!first || !last) return null;

    const opens = minutes(first[1]);
    const closes = minutes(last[2]);
    if (opens === null || closes === null || opens >= closes) return null;

    for (const day of days) week[day] = { opens, closes };
    matched = true;
  }

  return matched ? { week } : null;
}
