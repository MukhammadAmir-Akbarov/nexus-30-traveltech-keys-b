import type { I18nText, Source } from '../lib/types.ts';

/**
 * Темы, по которым официальные источники расходятся между собой.
 *
 * Проверка фактов бинарна не всегда: у части утверждений нет одного «верно» —
 * есть две позиции, и обе из уважаемых источников. Выдать одну за истину значит
 * сделать ровно то, в чём мы упрекаем недобросовестного гида. Поэтому такие
 * темы помечены отдельно: система показывает обе стороны и говорит прямо,
 * что спор не закрыт.
 *
 * `must` — слова, которые обязаны встретиться в утверждении (после токенизации
 * с латинско-кириллическими алиасами, поэтому работает на трёх языках).
 */
export type DisputedTopic = {
  id: string;
  placeId?: string;
  must: string[];
  question: I18nText;
  positions: { claim: I18nText; source: Source }[];
  note: I18nText;
};

const UNESCO_BUKHARA: Source = {
  title: {
    uz: 'YuNESKO: Buxoro tarixiy markazi',
    ru: 'ЮНЕСКО: Исторический центр Бухары',
    en: 'UNESCO: Historic Centre of Bukhara',
  },
  url: 'https://whc.unesco.org/en/list/602',
};

const UZ_TRAVEL: Source = {
  title: {
    uz: 'O‘zbekiston turizm portali',
    ru: 'Туристический портал Узбекистана',
    en: 'Uzbekistan travel portal',
  },
  url: 'https://uzbekistan.travel/',
};

export const DISPUTED: DisputedTopic[] = [
  {
    id: 'd1',
    placeId: 'poi-kalyan',
    must: ['калян', 'высота'],
    question: {
      uz: 'Kalon minorasining balandligi qancha?',
      ru: 'Какова высота минарета Калян?',
      en: 'How tall is the Kalyan minaret?',
    },
    positions: [
      {
        claim: {
          uz: 'Taxminan 45,6 metr — o‘lchov yer sathidan olingan.',
          ru: 'Около 45,6 метра — замер от уровня земли.',
          en: 'About 45.6 metres — measured from ground level.',
        },
        source: UNESCO_BUKHARA,
      },
      {
        claim: {
          uz: 'Taxminan 46,5 metr — poydevor bilan birga hisoblanganda.',
          ru: 'Около 46,5 метра — если считать вместе с фундаментом.',
          en: 'About 46.5 metres — counting the foundation.',
        },
        source: UZ_TRAVEL,
      },
    ],
    note: {
      uz: 'Farq o‘lchov nuqtasida: shuning uchun turli manbalarda turli raqam.',
      ru: 'Разница в точке отсчёта, поэтому в разных источниках разные цифры.',
      en: 'The difference is where you start measuring, hence the differing figures.',
    },
  },
  {
    id: 'd2',
    placeId: 'samanid-mausoleum',
    must: ['саманид'],
    question: {
      uz: 'Somoniylar maqbarasi qachon qurilgan?',
      ru: 'Когда построен мавзолей Саманидов?',
      en: 'When was the Samanid Mausoleum built?',
    },
    positions: [
      {
        claim: {
          uz: 'IX asr oxiri — Ismoil Somoniy davri, taxminan 892–907 yillar.',
          ru: 'Конец IX века — время Исмаила Самани, примерно 892–907 годы.',
          en: 'Late 9th century — the reign of Ismail Samani, roughly 892–907.',
        },
        source: UNESCO_BUKHARA,
      },
      {
        claim: {
          uz: 'X asr boshi — 943 yilgacha bo‘lgan davr, dafn sanasi bo‘yicha.',
          ru: 'Начало X века — до 943 года, по дате захоронения.',
          en: 'Early 10th century — up to 943, judging by the burial date.',
        },
        source: UZ_TRAVEL,
      },
    ],
    note: {
      uz: 'Aniq sana hujjatlarda yo‘q: manbalar oraliq beradi.',
      ru: 'Точной даты в документах нет: источники дают диапазон.',
      en: 'No document gives an exact date; sources offer a range instead.',
    },
  },
];

/** Слова, по которым тему ищем. Вынесено, чтобы не тянуть весь массив в поиск. */
export const DISPUTED_KEYS = DISPUTED.map((topic) => ({ id: topic.id, must: topic.must }));
