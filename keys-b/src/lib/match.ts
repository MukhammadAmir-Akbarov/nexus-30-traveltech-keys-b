import type { Gender, Guide, GuideAccuracy, I18nText, ScoredGuide, TripContext } from './types.ts';

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
  /** Репутация по проверкам фактов: guideId -> счётчики вердиктов. */
  accuracy?: Record<string, GuideAccuracy>;
};

/** Доля подтверждённых утверждений среди проверенных. */
export function accuracyRate(stats: GuideAccuracy): number | null {
  const decided = stats.confirmed + stats.refuted;
  return decided === 0 ? null : stats.confirmed / decided;
}

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
  accuracy: {
    // «1 проверок» звучит криво, а склонять число ради одной строки не стоит:
    // формулировка без согласования верна при любом количестве
    uz: 'faktlarining {percent}% tasdiqlangan (tekshiruv: {n})',
    ru: 'фактов подтвердилось {percent}% (проверок: {n})',
    en: '{percent}% of claims confirmed (checks: {n})',
  },
  soloSafety: {
    uz: 'yakka sayohat uchun tasdiqlangan gid',
    ru: 'проверенный гид для поездки в одиночку',
    en: 'verified guide for solo travel',
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
        // требование №3: одиночке подтверждённый статус важнее, чем остальным
        if (q.travelType === 'solo') {
          score += 2;
          reasons.push(REASON.soloSafety[lang]);
        }
      }
      score += guide.rating - 4;
      score += Math.min(guide.experienceYears, 15) / 15;

      // репутация по проверкам фактов: гид, чьи утверждения подтверждаются,
      // поднимается; тот, кого система регулярно опровергает, опускается
      const stats = q.accuracy?.[guide.id];
      const rate = stats ? accuracyRate(stats) : null;
      if (stats && rate !== null) {
        score += (rate - 0.5) * 6;
        reasons.push(
          REASON.accuracy[lang]
            .replace('{percent}', String(Math.round(rate * 100)))
            .replace('{n}', String(stats.confirmed + stats.refuted)),
        );
      }

      return {
        guide,
        score,
        why: reasons.length ? reasons.join(' · ') : REASON.fallback[lang],
        accuracy: stats,
      };
    })
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
