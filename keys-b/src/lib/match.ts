import type {
  Gender,
  Guide,
  GuideAccuracy,
  GuideAccuracyByPlace,
  I18nText,
  ScoredGuide,
  TripContext,
} from './types.ts';
import { TRAVEL_TYPE_LABEL } from './i18n.ts';

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
  /** Точность в разрезе объектов: guideId -> placeId -> счётчики. */
  accuracyByPlace?: Record<string, GuideAccuracyByPlace>;
  /** Объекты предстоящего маршрута: по ним и надо смотреть точность. */
  placeIds?: string[];
};

/**
 * Меньше этого числа вынесенных вердиктов — доля не показывается и не влияет
 * на подбор. Иначе гид с одной проверкой светит «100%» рядом с тем, у кого
 * двадцать две проверки и 95%, и это несправедливо к обоим.
 */
export const MIN_CHECKS = 5;

/** Доля подтверждённых утверждений среди проверенных. */
export function accuracyRate(stats: GuideAccuracy): number | null {
  const decided = stats.confirmed + stats.refuted;
  return decided === 0 ? null : stats.confirmed / decided;
}

/** Вынесенных вердиктов достаточно, чтобы доля что-то значила. */
export function hasEnoughChecks(stats: GuideAccuracy): boolean {
  return stats.confirmed + stats.refuted >= MIN_CHECKS;
}

/**
 * Нижняя граница доли по Вильсону (95%).
 * На ранжирование берём именно её, а не голую долю: 1 из 1 даёт 0.21, а 20 из 20 — 0.84,
 * поэтому новичок с одной удачной проверкой не обгоняет гида с двадцатью.
 */
export function wilsonLowerBound(confirmed: number, decided: number, z = 1.96): number {
  if (decided <= 0) return 0;
  const p = confirmed / decided;
  const denominator = 1 + (z * z) / decided;
  const centre = p + (z * z) / (2 * decided);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * decided)) / decided);
  return Math.max(0, (centre - margin) / denominator);
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
  tooFewChecks: {
    uz: 'tekshiruv kam ({n}) — aniqlik hali hisoblanmaydi',
    ru: 'проверок мало ({n}) — точность пока не считается',
    en: 'too few checks ({n}) — accuracy not counted yet',
  },
  soloSafety: {
    uz: 'yakka sayohat uchun tasdiqlangan gid',
    ru: 'проверенный гид для поездки в одиночку',
    en: 'verified guide for solo travel',
  },
  placeAccuracy: {
    uz: 'marshrutdagi obyektlar bo‘yicha {percent}% aniqlik',
    ru: 'по объектам вашего маршрута точность {percent}%',
    en: '{percent}% accuracy on your route’s places',
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
    // `q.gender ?? 'any'`, а не `q.gender === 'any'`: незаданный фильтр означает
    // «неважно», а не «ни один не подходит». Раньше запрос без gender отсеивал
    // ВСЕХ гидов и возвращал пустой список — молча, без ошибки. На границе
    // (/api/guides) это уже закрыто значением по умолчанию, но matchGuides()
    // вызывают и из кода, и там та же ловушка ждала следующего.
    .filter((g) => (q.gender ?? 'any') === 'any' || g.gender === q.gender)
    .filter((g) => !q.needTransport || g.hasTransport)
    .map((guide) => {
      const reasons: string[] = [];
      let score = 0;

      const wantedRegions = q.regions?.length
        ? q.regions
        : q.region && q.region !== 'all'
          ? [q.region]
          : [];
      if (wantedRegions.some((r) => guide.regions.includes(r))) {
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
        // формат поездки — словом на языке интерфейса, а не ключом «solo»
        reasons.push(REASON.travelType[lang].replace('{type}', TRAVEL_TYPE_LABEL[q.travelType][lang]));
      }
      const sharedLangs = guide.languages.filter((l) => wanted.includes(l));
      if (sharedLangs.length) {
        score += sharedLangs.length * 3;
        reasons.push(REASON.language[lang].replace('{n}', String(sharedLangs.length)));
      }
      if ((q.gender ?? 'any') !== 'any') reasons.push(REASON.gender[lang]);
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
      score += Math.min(guide.experienceYears, 15) / 15;

      // репутация по проверкам фактов: гид, чьи утверждения подтверждаются,
      // поднимается; тот, кого система регулярно опровергает, опускается
      const stats = q.accuracy?.[guide.id];
      const decided = stats ? stats.confirmed + stats.refuted : 0;
      const rate = stats ? accuracyRate(stats) : null;
      if (stats && rate !== null && decided >= MIN_CHECKS) {
        // ранжируем по нижней границе, а не по голой доле: см. wilsonLowerBound
        score += (wilsonLowerBound(stats.confirmed, decided) - 0.5) * 6;
        reasons.push(
          REASON.accuracy[lang]
            .replace('{percent}', String(Math.round(rate * 100)))
            .replace('{n}', String(decided)),
        );
      } else if (decided > 0) {
        // проверок мало — на подбор не влияем вовсе, но говорим об этом честно
        reasons.push(REASON.tooFewChecks[lang].replace('{n}', String(decided)));
      }

      /*
       * Звёздный рейтинг — только пока гида не измерили.
       *
       * Раньше `score += guide.rating - 4` стояло безусловно, и написанное
       * от руки число до +1 складывалось в ту же сумму, что нижняя граница
       * Вильсона (±3). То есть придуманный балл весил треть всей заработанной
       * репутации — в продукте, который утверждает ровно обратное: репутация
       * набирается проверками фактов, а не звёздами.
       *
       * Убрать совсем тоже неверно: у нового гида проверок нет, и тогда его
       * нечем упорядочить вовсе. Поэтому правило простое и объяснимое вслух:
       * звёзды работают, ПОКА система не набрала MIN_CHECKS вердиктов; как
       * только измерение появилось — оно звёзды заменяет, а не делит с ними вес.
       */
      const measured = rate !== null && decided >= MIN_CHECKS;
      if (!measured) score += guide.rating - 4;

      // Точность именно по объектам маршрута (из голосового отзыва):
      // общий балл гида может быть высоким, а нужный объект он знает плохо.
      const byPlace = q.accuracyByPlace?.[guide.id];
      if (byPlace && q.placeIds?.length) {
        const relevant = q.placeIds.map((id) => byPlace[id]).filter((x) => x !== undefined);
        const confirmed = relevant.reduce((sum, s) => sum + s.confirmed, 0);
        const refuted = relevant.reduce((sum, s) => sum + s.refuted, 0);
        // порог ниже общего: разрез по объектам заведомо реже, но одна проверка
        // всё равно не повод объявлять «100% точности на Регистане»
        if (confirmed + refuted >= 3) {
          const placeDecided = confirmed + refuted;
          const placeRate = confirmed / placeDecided;
          // вес больше, чем у общей точности: спрашивают именно про эти объекты
          score += (wilsonLowerBound(confirmed, placeDecided) - 0.5) * 8;
          reasons.push(
            REASON.placeAccuracy[lang].replace('{percent}', String(Math.round(placeRate * 100))),
          );
        }
      }

      return {
        guide,
        score,
        why: reasons.length ? reasons.join(' · ') : REASON.fallback[lang],
        accuracy: stats,
        byPlace,
      };
    })
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
