// Вердикт по правилам — без модели и без сети.
//
// ЗАЧЕМ. Без ключа модели /api/check отвечал «unclear» на всё, чего нет в
// демо-кэше: «показываю отрывки — сверьте формулировку сами». То есть главная
// функция продукта на любом живом вопросе жюри визуально не делала ничего.
// А в режиме MOCK_AI было хуже: любое утверждение, к которому нашёлся отрывок,
// объявлялось confirmed — включая заведомо ложное.
//
// ПРИНЦИП. Мы умеем надёжно ловить ровно один класс ошибок — числовой:
// перепутанный век и перепутанный год. Это же и самая частая ошибка в рассказе
// у объекта. Поэтому правило работает ТОЛЬКО на опровержение:
//
//   - нашли в утверждении век или год,
//   - нашли в отрывке источника век или год того же рода,
//   - они не совпадают -> refuted, и в correction подставляем то, что в источнике.
//
// Во всех остальных случаях правило молчит и возвращает null, а маршрут отвечает
// как раньше. Подтверждать по совпадению числа мы НЕ беремся: совпавший год
// не означает, что верна остальная часть фразы, и «confirmed» здесь был бы
// ровно тем враньём, против которого продукт и сделан.

const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18,
  xix: 19, xx: 20, xxi: 21,
};

/** Век на трёх языках: «XII век», «XII asrda», «12th century», «12-asr». */
const CENTURY_RE =
  /\b(?:([ivxlc]+)|(\d{1,2}))\s*[-–—]?\s*(?:asr|аср|век|века|веке|веков|century|centuries|st|nd|rd|th)/gi;

/** Год: только правдоподобные для наших объектов. */
const YEAR_RE = /\b(\d{3,4})\s*[-–—]?\s*(?:йил|yil|yilda|год|году|года|year)?\b/gi;

function centuriesIn(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(CENTURY_RE)) {
    const roman = match[1] ? ROMAN[match[1].toLowerCase()] : undefined;
    const arabic = match[2] ? Number(match[2]) : undefined;
    const value = roman ?? arabic;
    if (value && value >= 1 && value <= 21) found.add(value);
  }
  return [...found].sort((a, b) => a - b);
}

function yearsIn(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(YEAR_RE)) {
    const value = Number(match[1]);
    // ниже 700 — это уже не про наши объекты, а обрывок числа вроде «46 м»
    if (value >= 700 && value <= 2100) found.add(value);
  }
  return [...found].sort((a, b) => a - b);
}

/** Год попадает в диапазон, если источник пишет «1417–1420», а спрашивают про 1418. */
function withinRange(year: number, sourceYears: number[]): boolean {
  for (let i = 0; i < sourceYears.length - 1; i++) {
    if (year >= sourceYears[i] && year <= sourceYears[i + 1]) return true;
  }
  return false;
}

/** Век, к которому относится год: 1417 -> XV. */
function centuryOf(year: number): number {
  return Math.floor((year - 1) / 100) + 1;
}

export type RuleVerdict = {
  status: 'refuted';
  /** По какому признаку опровергли — нужно, чтобы объяснение было конкретным. */
  kind: 'century' | 'year';
  claimValue: number;
  sourceValues: number[];
  /** Отрывок, на котором сработало правило: он и пойдёт в объяснение. */
  passage: string;
};

/**
 * Опровержение по числам. null означает «правило ничего не утверждает»,
 * а не «утверждение верно».
 */
export function ruleVerdict(claim: string, passages: string[]): RuleVerdict | null {
  if (passages.length === 0) return null;

  const claimCenturies = centuriesIn(claim);
  const claimYears = yearsIn(claim);

  // Век проверяем первым: «построен в XII веке» — самая частая и самая
  // наглядная ошибка, и она читается зрителем без пояснений.
  if (claimCenturies.length === 1) {
    const claimCentury = claimCenturies[0];
    for (const passage of passages) {
      // век источника — явно указанный или выведенный из года
      const sourceCenturies = [
        ...new Set([...centuriesIn(passage), ...yearsIn(passage).map(centuryOf)]),
      ].sort((a, b) => a - b);
      if (sourceCenturies.length === 0) continue;

      // диапазон «XV–XVII» покрывает и XVI
      const min = sourceCenturies[0];
      const max = sourceCenturies[sourceCenturies.length - 1];
      if (claimCentury < min || claimCentury > max) {
        return {
          status: 'refuted',
          kind: 'century',
          claimValue: claimCentury,
          sourceValues: sourceCenturies,
          passage,
        };
      }
    }
  }

  // Год опровергаем осторожнее: только когда в утверждении ровно один год
  // и он не совпадает ни с одним годом источника и не лежит в его диапазоне.
  if (claimYears.length === 1 && claimCenturies.length === 0) {
    const claimYear = claimYears[0];
    for (const passage of passages) {
      const sourceYears = yearsIn(passage);
      if (sourceYears.length === 0) continue;
      if (sourceYears.includes(claimYear) || withinRange(claimYear, sourceYears)) return null;

      // Расхождение в пределах пары лет — это разночтение источников,
      // а не ошибка гида; такие темы у нас живут в disputed.ts.
      const closest = sourceYears.reduce((best, year) =>
        Math.abs(year - claimYear) < Math.abs(best - claimYear) ? year : best,
      );
      if (Math.abs(closest - claimYear) <= 2) return null;

      return {
        status: 'refuted',
        kind: 'year',
        claimValue: claimYear,
        sourceValues: sourceYears,
        passage,
      };
    }
  }

  return null;
}

/** Римская запись для объяснения: 15 -> XV. */
export function toRoman(value: number): string {
  const table: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rest = value;
  let out = '';
  for (const [weight, symbol] of table) {
    while (rest >= weight) {
      out += symbol;
      rest -= weight;
    }
  }
  return out;
}
