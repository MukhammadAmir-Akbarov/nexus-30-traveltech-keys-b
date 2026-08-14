import type { CheckVerdict, I18nText, Lang } from '../lib/types.ts';
import { tokenize } from '../lib/retrieval.ts';

/**
 * Предзаписанные вердикты для сценария демо — на трёх языках.
 * Нужны на случай, если на площадке нет интернета или LLM отвечает медленно.
 * Ключ — набор обязательных слов в утверждении (латиница и кириллица).
 */
type CachedVerdict = {
  must: string[];
  status: CheckVerdict['status'];
  explanation: I18nText;
  correction?: I18nText;
  source: { title: I18nText; url: string };
};

const UNESCO_SAMARKAND = {
  title: {
    uz: 'YuNESKO: Samarqand — madaniyatlar chorrahasi',
    ru: 'ЮНЕСКО: Самарканд — перекрёсток культур',
    en: 'UNESCO: Samarkand — Crossroads of Cultures',
  },
  url: 'https://whc.unesco.org/en/list/603',
};

const REGISTAN_DATES: CachedVerdict = {
  must: [],
  status: 'refuted',
  explanation: {
    uz: 'Registon XII asrga oid emas. Ansambl XV–XVII asrlarda shakllangan: Ulug‘bek madrasasi — 1417–1420, Sherdor — 1619–1636, Tillakori — 1646–1660.',
    ru: 'Регистан не относится к XII веку. Ансамбль сложился в XV–XVII веках: медресе Улугбека — 1417–1420, Шердор — 1619–1636, Тилля-Кари — 1646–1660.',
    en: 'Registan does not date to the 12th century. The ensemble took shape in the 15th–17th centuries: the Ulugh Beg madrasah in 1417–1420, Sher-Dor in 1619–1636, Tilya-Kori in 1646–1660.',
  },
  correction: {
    uz: 'Registon XII asrda emas, XV–XVII asrlarda qurilgan.',
    ru: 'Регистан построен в XV–XVII веках, а не в XII.',
    en: 'Registan was built in the 15th–17th centuries, not the 12th.',
  },
  source: UNESCO_SAMARKAND,
};

const CACHE: CachedVerdict[] = [
  { ...REGISTAN_DATES, must: ['регистан', '12'] },
  { ...REGISTAN_DATES, must: ['регистан', 'xii'] },
  { ...REGISTAN_DATES, must: ['registon', 'xii'] },
  { ...REGISTAN_DATES, must: ['registan', '12th'] },
  {
    must: ['калян', '100'],
    status: 'refuted',
    explanation: {
      uz: 'Kalon minorasining balandligi 100 emas, taxminan 46 metr. Minora 1127 yilda qurilgan.',
      ru: 'Высота минарета Калян — около 46 метров, а не 100. Минарет построен в 1127 году.',
      en: 'The Kalyan minaret is about 46 metres tall, not 100. It was built in 1127.',
    },
    correction: {
      uz: 'Kalon minorasining balandligi — taxminan 46 metr.',
      ru: 'Высота минарета Калян — примерно 46 метров.',
      en: 'The Kalyan minaret is roughly 46 metres tall.',
    },
    source: {
      title: {
        uz: 'YuNESKO: Buxoro tarixiy markazi',
        ru: 'ЮНЕСКО: Исторический центр Бухары',
        en: 'UNESCO: Historic Centre of Bukhara',
      },
      url: 'https://whc.unesco.org/en/list/602',
    },
  },
  {
    must: ['ичан', 'первый'],
    status: 'confirmed',
    explanation: {
      uz: 'To‘g‘ri: Xivadagi Ichan Qal’a 1990 yilda YuNESKO Butunjahon merosi ro‘yxatiga kirgan va O‘zbekistondagi birinchi obyekt bo‘lgan.',
      ru: 'Верно: Ичан-Кала в Хиве вошла в Список всемирного наследия ЮНЕСКО в 1990 году и стала первым объектом Узбекистана в этом списке.',
      en: 'Correct: Itchan Kala in Khiva joined the UNESCO World Heritage List in 1990 as Uzbekistan’s first site.',
    },
    source: {
      title: { uz: 'YuNESKO: Ichan Qal’a', ru: 'ЮНЕСКО: Ичан-Кала', en: 'UNESCO: Itchan Kala' },
      url: 'https://whc.unesco.org/en/list/543',
    },
  },
];

export function lookupDemoVerdict(claim: string, lang: Lang): CheckVerdict | null {
  const tokens = new Set(tokenize(claim));
  const raw = claim.toLowerCase();
  for (const entry of CACHE) {
    const ok = entry.must.every((m) => tokens.has(m) || raw.includes(m));
    if (!ok) continue;
    return {
      claim,
      status: entry.status,
      explanation: entry.explanation[lang],
      correction: entry.correction?.[lang],
      sources: [{ title: entry.source.title[lang], url: entry.source.url }],
    };
  }
  return null;
}
