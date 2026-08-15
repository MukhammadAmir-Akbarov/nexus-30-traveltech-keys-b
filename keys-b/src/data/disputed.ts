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
  tier: 'official',
};

const UZ_TRAVEL: Source = {
  title: {
    uz: 'O‘zbekiston turizm portali',
    ru: 'Туристический портал Узбекистана',
    en: 'Uzbekistan travel portal',
  },
  url: 'https://uzbekistan.travel/',
  tier: 'secondary',
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
    must: ['самани'],
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

const UNESCO_SAMARKAND: Source = {
  title: {
    uz: 'YuNESKO: Samarqand — madaniyatlar chorrahasi',
    ru: 'ЮНЕСКО: Самарканд — перекрёсток культур',
    en: 'UNESCO: Samarkand — Crossroads of Cultures',
  },
  url: 'https://whc.unesco.org/en/list/603',
  tier: 'official',
};

const UNESCO_KHIVA: Source = {
  title: { uz: 'YuNESKO: Ichan Qal’a', ru: 'ЮНЕСКО: Ичан-Кала', en: 'UNESCO: Itchan Kala' },
  url: 'https://whc.unesco.org/en/list/543',
  tier: 'official',
};

DISPUTED.push(
  {
    id: 'd3',
    must: ['бухар', 'лет'],
    question: {
      uz: 'Buxoro necha yoshda?',
      ru: 'Сколько лет Бухаре?',
      en: 'How old is Bukhara?',
    },
    positions: [
      {
        claim: {
          uz: '2500 yil — 1997 yilda nishonlangan yubiley sanasi.',
          ru: '2500 лет — юбилейная дата, отмечавшаяся в 1997 году.',
          en: '2,500 years — the anniversary date marked in 1997.',
        },
        source: UZ_TRAVEL,
      },
      {
        claim: {
          uz: 'Arxeologik qatlamlar aniq sanani bermaydi: baholar bir necha asrga farq qiladi.',
          ru: 'Археологические слои точной даты не дают: оценки расходятся на несколько веков.',
          en: 'The archaeological layers give no exact date: estimates differ by centuries.',
        },
        source: UNESCO_BUKHARA,
      },
    ],
    note: {
      uz: 'Yubiley sanasi — qaror, arxeologiya esa oraliq beradi.',
      ru: 'Юбилейная дата — это решение, а археология даёт диапазон.',
      en: 'An anniversary date is a decision; archaeology offers a range.',
    },
  },
  {
    id: 'd4',
    placeId: 'registan',
    must: ['регист', 'медрес'],
    question: {
      uz: 'Registonda nechta madrasa bor?',
      ru: 'Сколько медресе на Регистане?',
      en: 'How many madrasahs are there on the Registan?',
    },
    positions: [
      {
        claim: {
          uz: 'Uchta: Ulug‘bek, Sherdor va Tillakori.',
          ru: 'Три: Улугбека, Шердор и Тилля-Кари.',
          en: 'Three: Ulugh Beg, Sher-Dor and Tilya-Kori.',
        },
        source: UNESCO_SAMARKAND,
      },
      {
        claim: {
          uz: 'Tillakori ko‘proq masjid vazifasini bajargan, shuning uchun uni madrasa deb sanamaydiganlar ham bor.',
          ru: 'Тилля-Кари служила скорее мечетью, поэтому её не всегда считают медресе.',
          en: 'Tilya-Kori functioned mainly as a mosque, so it is not always counted as a madrasah.',
        },
        source: UZ_TRAVEL,
      },
    ],
    note: {
      uz: 'Bahs bino sonida emas, «madrasa» ta’rifida.',
      ru: 'Спор не о числе зданий, а об определении слова «медресе».',
      en: 'The dispute is not about the buildings but about what counts as a madrasah.',
    },
  },
  {
    id: 'd5',
    placeId: 'ichan-kala',
    // Спор именно о годе, а не о самом факте включения: без года условие
    // перехватывало демо-пример «первый объект ЮНЕСКО» и ломало его вердикт.
    must: ['ичан', '199'],
    question: {
      uz: 'Ichan Qal’a qachon YuNESKO ro‘yxatiga kirgan?',
      ru: 'В каком году Ичан-Кала вошла в список ЮНЕСКО?',
      en: 'When did Itchan Kala enter the UNESCO list?',
    },
    positions: [
      {
        claim: {
          uz: '1990 yil — ro‘yxatga kiritilgan sana.',
          ru: '1990 год — дата включения в список.',
          en: '1990 — the year of inscription.',
        },
        source: UNESCO_KHIVA,
      },
      {
        claim: {
          uz: 'Ba’zi nashrlarda 1991 yil ko‘rsatiladi — hujjat rasmiylashtirilgan yil bo‘yicha.',
          ru: 'В части изданий указывают 1991 год — по году оформления документов.',
          en: 'Some publications give 1991, going by the year the paperwork was completed.',
        },
        source: UZ_TRAVEL,
      },
    ],
    note: {
      uz: 'Sana bitta, farq — qaysi hujjatdan sanash.',
      ru: 'Дата одна, расходится точка отсчёта: решение или оформление.',
      en: 'One event, two starting points: the decision or the paperwork.',
    },
  },
  {
    id: 'd6',
    placeId: 'bibi-khanym',
    must: ['биби'],
    question: {
      uz: 'Bibixonim masjidini kim qurdirgan?',
      ru: 'По чьему заказу построена мечеть Биби-Ханым?',
      en: 'Who commissioned the Bibi-Khanym mosque?',
    },
    positions: [
      {
        claim: {
          uz: 'Amir Temur — Hindiston yurishidan keyin.',
          ru: 'Амир Темур — после похода в Индию.',
          en: 'Amir Temur, after his Indian campaign.',
        },
        source: UNESCO_SAMARKAND,
      },
      {
        claim: {
          uz: 'Xalq rivoyatida qurilish Temurning xotiniga bog‘lanadi — bu afsona, hujjat emas.',
          ru: 'Народное предание связывает постройку с женой Темура — это легенда, а не документ.',
          en: 'Folk tradition credits Temur’s wife — that is legend, not record.',
        },
        source: UZ_TRAVEL,
      },
    ],
    note: {
      uz: 'Gidlar ko‘pincha rivoyatni fakt sifatida aytadi — shuning uchun bu alohida belgilangan.',
      ru: 'Гиды часто пересказывают легенду как факт — поэтому тема помечена отдельно.',
      en: 'Guides often retell the legend as fact — hence the separate flag.',
    },
  },
);
