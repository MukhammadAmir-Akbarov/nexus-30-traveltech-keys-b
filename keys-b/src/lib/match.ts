import type { Gender, Guide, I18nText, ScoredGuide, TripContext } from './types.ts';

// Подбор гида: чистая функция, без LLM. Объяснение «почему этот гид»
// собирается из совпавших признаков — модель здесь не нужна.
//
// Фильтры взяты из отзыва (запись 2): несколько языков сразу, пол гида и
// наличие своего транспорта. Пол и транспорт — жёсткие фильтры: если турист
// просит гида-женщину, мужчина в выдаче не нужен вовсе.

export type GuideQuery = TripContext & {
  languages: string[];
  gender: Gender | 'any';
  needTransport: boolean;
};

const REASON = {
  region: {
    uz: 'tanlangan hududda ishlaydi',
    ru: 'работает в выбранном регионе',
    en: 'works in the selected region',
  },
  interests: {
    uz: 'ixtisosligi mos ({n})',
    ru: 'специализация совпадает ({n})',
    en: 'specialisation matches ({n})',
  },
  travelType: {
    uz: '«{type}» formatini olib boradi',
    ru: 'ведёт формат «{type}»',
    en: 'runs the “{type}” format',
  },
  language: {
    uz: 'kerakli tilda gapiradi ({n})',
    ru: 'говорит на нужном языке ({n})',
    en: 'speaks the language you need ({n})',
  },
  gender: {
    uz: 'so‘ralgan jinsdagi gid',
    ru: 'пол соответствует запросу',
    en: 'matches the requested gender',
  },
  transport: {
    uz: 'o‘z transporti bor',
    ru: 'есть свой транспорт',
    en: 'has own transport',
  },
  verified: {
    uz: 'holati tasdiqlangan (demo)',
    ru: 'статус подтверждён (демо)',
    en: 'status verified (demo)',
  },
  fallback: {
    uz: 'hudud bo‘yicha umumiy moslik',
    ru: 'общий профиль по региону',
    en: 'general regional match',
  },
} satisfies Record<string, I18nText>;

export function matchGuides(guides: Guide[], q: GuideQuery, limit = 5): ScoredGuide[] {
  const lang = q.lang;
  const wanted = q.languages ?? [];

  return guides
    // жёсткие фильтры: то, что турист прямо запросил
    .filter((g) => q.gender === 'any' || g.gender === q.gender)
    .filter((g) => !q.needTransport || g.hasTransport)
    .map((guide) => {
      const reasons: string[] = [];
      let score = 0;

      if (q.region !== 'all' && guide.regions.includes(q.region)) {
        score += 4;
        reasons.push(REASON.region[lang]);
      }
      const sharedInterests = guide.specializations.filter((s) => q.interests.includes(s));
      if (sharedInterests.length) {
        score += sharedInterests.length * 2;
        reasons.push(REASON.interests[lang].replace('{n}', String(sharedInterests.length)));
      }
      if (guide.travelTypes.includes(q.travelType)) {
        score += 2;
        reasons.push(REASON.travelType[lang].replace('{type}', q.travelType));
      }
      const sharedLangs = guide.languages.filter((l) => wanted.includes(l));
      if (sharedLangs.length) {
        score += sharedLangs.length * 3;
        reasons.push(REASON.language[lang].replace('{n}', String(sharedLangs.length)));
      }
      if (q.gender !== 'any') reasons.push(REASON.gender[lang]);
      if (q.needTransport) {
        score += 1;
        reasons.push(REASON.transport[lang]);
      }
      if (guide.verified) {
        score += 1.5;
        reasons.push(REASON.verified[lang]);
      }
      score += guide.rating - 4;
      score += Math.min(guide.experienceYears, 15) / 15;

      return {
        guide,
        score,
        why: reasons.length ? reasons.join(' · ') : REASON.fallback[lang],
      };
    })
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
