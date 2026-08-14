import type { Guide, I18nText, ScoredGuide, TripContext } from './types.ts';

// Подбор гида: чистая функция, без LLM. Объяснение «почему этот гид»
// собирается из совпавших признаков — модель здесь не нужна.

export type GuideQuery = TripContext & { language: string | 'any' };

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
    uz: 'kerakli tilda gapiradi',
    ru: 'говорит на нужном языке',
    en: 'speaks the language you need',
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

  return guides
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
      if (q.language !== 'any' && guide.languages.includes(q.language)) {
        score += 3;
        reasons.push(REASON.language[lang]);
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
