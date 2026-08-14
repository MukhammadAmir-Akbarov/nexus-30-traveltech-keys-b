import type { CheckVerdict } from '../lib/types.ts';
import { tokenize } from '../lib/retrieval.ts';

/**
 * Предзаписанные вердикты для сценария демо.
 * Нужны на случай, если на площадке нет интернета или LLM отвечает медленно.
 * Ключ — набор обязательных слов в утверждении.
 */
type CachedVerdict = { must: string[]; verdict: Omit<CheckVerdict, 'claim'> };

const CACHE: CachedVerdict[] = [
  {
    must: ['регистан', '12'],
    verdict: {
      status: 'refuted',
      explanation:
        'Регистан не относится к XII веку. Ансамбль сложился в XV–XVII веках: медресе Улугбека — 1417–1420, Шердор — 1619–1636, Тилля-Кари — 1646–1660.',
      correction: 'Регистан построен в XV–XVII веках, а не в XII.',
      sources: [{ title: 'ЮНЕСКО: Самарканд — перекрёсток культур', url: 'https://whc.unesco.org/en/list/603' }],
    },
  },
  {
    must: ['регистан', 'xii'],
    verdict: {
      status: 'refuted',
      explanation:
        'Регистан не относится к XII веку. Ансамбль сложился в XV–XVII веках: медресе Улугбека — 1417–1420, Шердор — 1619–1636, Тилля-Кари — 1646–1660.',
      correction: 'Регистан построен в XV–XVII веках, а не в XII.',
      sources: [{ title: 'ЮНЕСКО: Самарканд — перекрёсток культур', url: 'https://whc.unesco.org/en/list/603' }],
    },
  },
  {
    must: ['калян', '100'],
    verdict: {
      status: 'refuted',
      explanation: 'Высота минарета Калян — около 46 метров, а не 100. Минарет построен в 1127 году.',
      correction: 'Высота минарета Калян — примерно 46 метров.',
      sources: [{ title: 'ЮНЕСКО: Исторический центр Бухары', url: 'https://whc.unesco.org/en/list/602' }],
    },
  },
  {
    must: ['ичан', 'первый'],
    verdict: {
      status: 'confirmed',
      explanation:
        'Верно: Ичан-Кала в Хиве вошла в Список всемирного наследия ЮНЕСКО в 1990 году и стала первым объектом Узбекистана в этом списке.',
      sources: [{ title: 'ЮНЕСКО: Ичан-Кала', url: 'https://whc.unesco.org/en/list/543' }],
    },
  },
];

export function lookupDemoVerdict(claim: string): CheckVerdict | null {
  const tokens = new Set(tokenize(claim));
  const raw = claim.toLowerCase();
  for (const entry of CACHE) {
    const ok = entry.must.every((m) => tokens.has(m) || raw.includes(m));
    if (ok) return { claim, ...entry.verdict };
  }
  return null;
}
