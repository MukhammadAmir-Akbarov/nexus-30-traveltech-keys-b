import type { Guide, ScoredGuide, TripContext } from './types.ts';

// Подбор гида: чистая функция, без LLM. Объяснение «почему этот гид»
// собирается из совпавших признаков — модель здесь не нужна.

export type GuideQuery = TripContext & { language: string | 'any' };

export function matchGuides(guides: Guide[], q: GuideQuery, limit = 5): ScoredGuide[] {
  return guides
    .map((guide) => {
      const reasons: string[] = [];
      let score = 0;

      if (q.region !== 'all' && guide.regions.includes(q.region)) {
        score += 4;
        reasons.push('работает в выбранном регионе');
      }
      const sharedInterests = guide.specializations.filter((s) => q.interests.includes(s));
      if (sharedInterests.length) {
        score += sharedInterests.length * 2;
        reasons.push(`специализация совпадает (${sharedInterests.length})`);
      }
      if (guide.travelTypes.includes(q.travelType)) {
        score += 2;
        reasons.push(`ведёт формат «${q.travelType}»`);
      }
      if (q.language !== 'any' && guide.languages.includes(q.language)) {
        score += 3;
        reasons.push('говорит на нужном языке');
      }
      if (guide.verified) {
        score += 1.5;
        reasons.push('статус подтверждён (демо)');
      }
      score += guide.rating - 4;
      score += Math.min(guide.experienceYears, 15) / 15;

      return {
        guide,
        score,
        why: reasons.length ? reasons.join(' · ') : 'общий профиль по региону',
      };
    })
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
