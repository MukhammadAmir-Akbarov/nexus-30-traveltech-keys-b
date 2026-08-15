// Одна самопроверка на всю нетривиальную логику: поиск по корпусу,
// планировщик, подбор гида и трёхъязычность. Запуск: npm run check
// (Node 22 сам снимает типы, поэтому импорты — с расширением .ts.)
import assert from 'node:assert/strict';
import { CORPUS } from '../data/corpus.ts';
import { GUIDES } from '../data/guides.ts';
import { PLACES } from '../data/places.ts';
import { lookupDemoVerdict } from '../data/demo-cache.ts';
import { MIN_CHECKS, accuracyRate, hasEnoughChecks, matchGuides, wilsonLowerBound } from './match.ts';
import { buildItinerary } from './planner.ts';
import { retrieve } from './retrieval.ts';
import { buildTransfer, planeLeg, trainLeg } from './transfer.ts';
import { itineraryToIcs } from './ics.ts';
import { disputedForLang, findDisputed } from './disputed.ts';
import { adviceFor, climateNorm, tripDates } from './weather.ts';
import { prayerTimes, prayersDuring } from './prayer.ts';
import { parseTripPhrase } from './voice-trip.ts';
import { seasonBudgetFactor, seasonFor, seasonNote, seasonsFor } from './calendar.ts';
import {
  budgetScoreBonus,
  dailyCapUsd,
  overBudget,
  usdToUzsLabel,
} from './budget.ts';
import { PHOTOS } from '../data/photos.ts';
import { officialFactsFor } from './sources.ts';
import { danglingRefs, factsFor, photo as dbPhoto, place as dbPlace, places as dbPlaces } from './db.ts';
import { WINDY_KMH, isWindy } from './weather.ts';
import {
  directRoute,
  distanceLabel,
  haversineKm,
  legFrom,
  navigatorUrl,
  parseOsrm,
  routeTotals,
  taxiFareUsd,
} from './route.ts';
import type { DayWeather } from './types.ts';
import { GUIDE_LANGS, REVIEW_TEMPLATE, TRAVEL_TYPE_LABEL, UI, reviewsLabel, yearsLabel } from './i18n.ts';
import {
  clearLoginAttempts,
  hashPassword,
  isLockedOut,
  loginKey,
  noteFailedLogin,
  signSession,
  verifyPassword,
  verifySession,
} from './auth.ts';
import type { Lang, ScoredGuide, TripContext } from './types.ts';

const LANGS: Lang[] = ['uz', 'ru', 'en'];

// --- поиск по корпусу ---
const hits = retrieve(CORPUS, 'Когда построен Регистан?', 3);
assert.ok(hits.length > 0, 'поиск обязан что-то найти по Регистану');
assert.equal(hits[0].item.id, 'c01', 'первым должен быть абзац с датами Регистана');

const minaret = retrieve(CORPUS, 'высота минарета Калян', 3);
assert.equal(minaret[0].item.id, 'c16', 'первым должен быть абзац про 46 метров');

assert.deepEqual(retrieve(CORPUS, '???', 3), [], 'мусорный запрос -> пустой результат');

// кроссязычный поиск: корпус русский, запрос на узбекском и английском
assert.equal(
  retrieve(CORPUS, 'Registon qachon qurilgan?', 3)[0]?.item.id,
  'c01',
  'узбекский запрос должен находить тот же абзац',
);
assert.equal(
  retrieve(CORPUS, 'height of the Kalyan minaret', 3)[0]?.item.id,
  'c16',
  'английский запрос должен находить тот же абзац',
);

// --- предзаписанные вердикты демо на всех языках ---
for (const lang of LANGS) {
  const cached = lookupDemoVerdict('Регистан построен в XII веке', lang);
  assert.equal(cached?.status, 'refuted', `вердикт демо должен работать для ${lang}`);
  assert.ok(cached?.explanation.length, `объяснение не должно быть пустым для ${lang}`);
  assert.ok(cached?.sources.length, `источник обязателен для ${lang}`);
}
assert.ok(
  lookupDemoVerdict('Registon XII asrda qurilgan', 'uz')?.status === 'refuted',
  'узбекская формулировка тоже должна попадать в кэш демо',
);
assert.equal(lookupDemoVerdict('Где поесть плов?', 'ru'), null, 'вне сценария демо — кэша нет');

// --- полнота переводов данных ---
for (const lang of LANGS) {
  assert.ok(
    PLACES.every((p) => p.name[lang]?.length && p.summary[lang]?.length),
    `у всех объектов должен быть перевод на ${lang}`,
  );
  assert.ok(
    GUIDES.every((g) => g.bio[lang]?.length),
    `у всех гидов должно быть описание на ${lang}`,
  );
  assert.ok(
    CORPUS.every((c) => c.source.title[lang]?.length),
    `у всех источников должен быть заголовок на ${lang}`,
  );
}

// --- планировщик ---
const family: TripContext = {
  region: 'samarkand',
  regions: ['samarkand'],
  interests: ['history', 'architecture'],
  travelType: 'family',
  days: 2,
  lang: 'ru',
  summer: false,
};
const plan = buildItinerary(PLACES, family);
assert.ok(plan.days.length > 0 && plan.days.length <= family.days, 'дней не больше запрошенного');

const ids = plan.days.flatMap((d) => d.items.map((i) => i.placeId));
assert.equal(new Set(ids).size, ids.length, 'объект не должен повторяться в маршруте');
assert.ok(
  ids.every((id) => PLACES.find((p) => p.id === id)?.region === 'samarkand'),
  'при выбранном регионе в маршрут попадают только его объекты',
);
assert.ok(
  !ids.includes('shahi-zinda'),
  'для семейного формата объект с familyFriendly=false исключается',
);

// маршрут должен собираться на любом языке интерфейса
for (const lang of LANGS) {
  const localized = buildItinerary(PLACES, { ...family, lang });
  assert.ok(localized.summary.length > 0, `итог маршрута не пустой на ${lang}`);
  assert.ok(
    localized.days.every((d) => d.title.length > 0 && d.items.every((i) => i.note.length > 0)),
    `заголовки и заметки заполнены на ${lang}`,
  );
}

// отзыв с записи 1: при большом числе дней объекты одного города должны
// группироваться по дням, а не выдаваться по одному на день
const week = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 7 });
assert.ok(
  week.days[0].items.length >= 3,
  'в первом дне города должно быть несколько близких объектов',
);
assert.ok(
  week.days.length <= 3,
  'шесть объектов одного города не должны растягиваться на семь дней',
);

// отзыв с записи 3: маршрут по стране идёт из Ташкента и содержит переезды
const country = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  region: 'all',
  regions: [],
  days: 7,
});
const cityOf = (placeId: string) => PLACES.find((p) => p.id === placeId)!.region;
assert.equal(
  cityOf(country.days[0].items[0].placeId),
  'tashkent',
  'страновой маршрут начинается в точке входа — Ташкенте',
);
assert.ok(
  new Set(country.days.flatMap((d) => d.items.map((i) => cityOf(i.placeId)))).size >= 3,
  'страновой маршрут должен охватывать несколько городов',
);
const transfers = country.days.map((d) => d.transfer).filter((x) => x !== undefined);
assert.ok(transfers.length >= 2, 'между городами должны появляться переезды');

// Порядок городов — по времени в пути, а не по прямой линии на карте.
// Проверяем само правило, а не конкретный город: появится новый рейс —
// маршрут имеет право перестроиться, но выезжать из Ташкента он должен
// быстрым транспортом, а не четырёхчасовой машиной до ближайшей точки.
const firstLeg = transfers[0].options[0];
assert.ok(
  ['plane', 'train'].includes(firstLeg.mode),
  `из Ташкента выезжаем быстрым транспортом, а получили ${firstLeg.mode}`,
);
assert.ok(firstLeg.hours <= 2, 'первый переезд не должен съедать полдня');
assert.notEqual(
  transfers[0].toRegion,
  'nurata',
  'Нурата ближе по карте, но туда только машиной — она не должна быть первой',
);

// §4.2 ТЗ: у переезда есть варианты транспорта со временем и ценой
for (const transfer of transfers) {
  assert.ok(transfer.options.length >= 2, 'должно быть минимум два способа переезда');
  assert.ok(
    transfer.options.every((o) => o.hours > 0 && o.priceUsd > 0),
    'у каждого варианта есть время и цена',
  );
  assert.ok(
    transfer.options.every((o, i) => i === 0 || transfer.options[i - 1].hours <= o.hours),
    'варианты отсортированы по времени в пути',
  );
}
// поезд предлагается только там, где он ходит
assert.ok(
  transfers.every((tr) =>
    tr.options.some((o) => o.mode === 'train') ? trainLeg(tr.fromRegion, tr.toRegion) : true,
  ),
  'поезд не должен появляться на направлении без железной дороги',
);
assert.equal(
  trainLeg('bukhara', 'nurata'),
  null,
  'на Нурату поезда нет — вариант не выдумываем',
);
assert.ok(
  buildTransfer('tashkent', 'samarkand', 260).options[0].mode === 'train',
  'Ташкент — Самарканд: самый быстрый вариант это поезд',
);
assert.ok(
  country.days.every((d) => new Set(d.items.map((i) => cityOf(i.placeId))).size === 1),
  'в одном дне объекты только одного города',
);

// интересы не совпали, но регион выбран -> показываем объекты региона, а не пустоту
const fallback = buildItinerary(PLACES, { ...family, region: 'khiva', regions: ['khiva'], interests: ['food'] });
assert.ok(fallback.days.length > 0, 'выбранный регион сам по себе даёт маршрут');
assert.ok(
  fallback.days.flatMap((d) => d.items).every((i) => i.placeId !== 'islam-khoja'),
  'семейный фильтр действует и в этом случае',
);

// пустой пул объектов не должен ронять планировщик
assert.equal(buildItinerary([], family).days.length, 0, 'пустой список -> пустой маршрут');

// --- подбор гида ---
const baseQuery = { ...family, languages: ['en'], gender: 'any' as const, needTransport: false };
const guides = matchGuides(GUIDES, baseQuery);
assert.ok(guides.length > 0, 'гиды должны находиться');
assert.ok(
  guides[0].guide.regions.includes('samarkand') && guides[0].guide.languages.includes('en'),
  'на первом месте — гид по региону и с нужным языком',
);
assert.ok(guides[0].why.length > 0, 'у рекомендации должно быть объяснение');
assert.ok(
  guides.every((g, i) => i === 0 || guides[i - 1].score >= g.score),
  'результаты отсортированы по убыванию',
);
for (const lang of LANGS) {
  const localized = matchGuides(GUIDES, { ...baseQuery, lang });
  assert.ok(localized[0].why.length > 0, `объяснение подбора не пустое на ${lang}`);
}

// отзыв с записи 2: пол и транспорт — жёсткие фильтры, а языков можно выбрать несколько
assert.ok(
  matchGuides(GUIDES, { ...baseQuery, gender: 'female' }).every(
    (g) => g.guide.gender === 'female',
  ),
  'при запросе гида-женщины мужчины в выдачу не попадают',
);
assert.ok(
  matchGuides(GUIDES, { ...baseQuery, needTransport: true }).every((g) => g.guide.hasTransport),
  'при требовании транспорта остаются только гиды с транспортом',
);
const multiLang = matchGuides(GUIDES, { ...baseQuery, languages: ['fr', 'it'] });
assert.ok(
  multiLang.length > 0 &&
    multiLang[0].guide.languages.some((l) => ['fr', 'it'].includes(l)),
  'мультиязычный фильтр поднимает гида с одним из выбранных языков',
);

// репутация по фактчеку: гид с подтверждёнными фактами обгоняет того,
// кого система регулярно опровергает
const accuracy = {
  g2: { confirmed: 10, refuted: 0, unclear: 0 },
  g8: { confirmed: 1, refuted: 9, unclear: 0 },
};
const byAccuracy = matchGuides(GUIDES, {
  ...baseQuery,
  region: 'bukhara',
  regions: ['bukhara' as const],
  interests: ['history', 'architecture'],
  languages: ['ru'],
  accuracy,
});
const positionOf = (id: string) => byAccuracy.findIndex((g) => g.guide.id === id);
assert.ok(
  positionOf('g2') < positionOf('g8'),
  'гид с подтверждёнными фактами должен стоять выше опровергнутого',
);
assert.ok(
  byAccuracy.find((g) => g.guide.id === 'g2')?.why.includes('100'),
  'в объяснении показывается доля подтверждённых фактов',
);
assert.equal(
  accuracyRate({ confirmed: 0, refuted: 0, unclear: 5 }),
  null,
  'без вынесенных вердиктов доля не считается — делить на ноль нечего',
);
assert.equal(accuracyRate({ confirmed: 3, refuted: 1, unclear: 9 }), 0.75, 'unclear не портит долю');

// --- справедливость репутации ---

// одна удачная проверка не должна выглядеть как безупречная репутация
assert.ok(!hasEnoughChecks({ confirmed: 1, refuted: 0, unclear: 0 }), '1 проверки мало');
assert.ok(
  hasEnoughChecks({ confirmed: MIN_CHECKS, refuted: 0, unclear: 0 }),
  `${MIN_CHECKS} проверок достаточно`,
);
assert.ok(
  wilsonLowerBound(1, 1) < wilsonLowerBound(20, 20),
  'при равной доле больше проверок — выше нижняя граница',
);
assert.ok(wilsonLowerBound(1, 1) < 0.5, '1 из 1 не должно котироваться как половина');
assert.equal(wilsonLowerBound(0, 0), 0, 'без проверок граница нулевая, деления на ноль нет');

// новичок с одной проверкой не обгоняет гида с двадцатью при той же доле
const rookieVsVeteran = matchGuides(
  GUIDES,
  {
    ...baseQuery,
    accuracy: {
      g2: { confirmed: 1, refuted: 0, unclear: 0 },
      g1: { confirmed: 20, refuted: 0, unclear: 0 },
    },
  },
  10,
);
const scoreById = (id: string) => rookieVsVeteran.find((g) => g.guide.id === id)?.score ?? 0;
assert.ok(
  scoreById('g1') > scoreById('g2'),
  'гид с 20 подтверждениями должен быть выше гида с одним',
);
assert.ok(
  rookieVsVeteran.find((g) => g.guide.id === 'g2')?.why.includes('мало'),
  'у гида с одной проверкой в объяснении должно быть сказано, что данных мало',
);
assert.ok(
  !rookieVsVeteran.find((g) => g.guide.id === 'g2')?.why.includes('100%'),
  'процент по одной проверке показывать нельзя',
);

// отзыв с записи 5: узбекский обязателен, и языков должно быть больше трёх
assert.ok(
  GUIDE_LANGS.includes('uz') && GUIDE_LANGS.length >= 8,
  'список языков гидов включает узбекский и не ограничен тремя',
);
assert.ok(
  GUIDES.some((g) => g.languages.includes('fr')) && GUIDES.some((g) => g.languages.includes('it')),
  'в базе есть гиды с французским и итальянским',
);

// требование №3 ТЗ: у одиночки подтверждённый статус гида весит больше
const soloQuery = {
  ...baseQuery,
  travelType: 'solo' as const,
  region: 'tashkent' as const,
  regions: ['tashkent' as const],
};
const soloPick = matchGuides(GUIDES, soloQuery);
const groupPick = matchGuides(GUIDES, { ...soloQuery, travelType: 'group' as const });
const scoreOf = (list: typeof soloPick, id: string) =>
  list.find((g) => g.guide.id === id)?.score ?? 0;
// g4 (Ташкент, без подтверждения) против подтверждённых: в соло-режиме разрыв больше
assert.ok(
  scoreOf(soloPick, 'g9') - scoreOf(soloPick, 'g4') >
    scoreOf(groupPick, 'g9') - scoreOf(groupPick, 'g4'),
  'в одиночной поездке подтверждённый гид должен отрываться сильнее',
);
assert.ok(
  soloPick.find((g) => g.guide.verified)?.why.includes('в одиночку'),
  'в объяснении подтверждённого гида должна появиться причина «для поездки в одиночку»',
);
assert.ok(
  !groupPick.find((g) => g.guide.verified)?.why.includes('в одиночку'),
  'для группы этой причины быть не должно',
);

// летнее правило: объекты под открытым небом получают пометку и идут первыми в дне
const summerPlan = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  region: 'bukhara',
  regions: ['bukhara'],
  summer: true,
});
const firstDayItems = summerPlan.days[0].items;
assert.ok(
  PLACES.find((p) => p.id === firstDayItems[0].placeId)?.outdoor,
  'летом день начинается с объекта под открытым небом — по утренней прохладе',
);
assert.ok(
  firstDayItems.some((i) => i.note.includes('+38')),
  'у открытого объекта летом должна быть пометка про жару',
);
assert.ok(
  !buildItinerary(PLACES, { ...family, travelType: 'solo', region: 'bukhara', regions: ['bukhara'] })
    .days[0].items.some((i) => i.note.includes('+38')),
  'вне летнего режима пометки про жару быть не должно',
);

// --- то, что пользователь читает глазами ---

// формат поездки в тексте должен быть словом на языке интерфейса, а не ключом «solo»
for (const lang of LANGS) {
  const localized = buildItinerary(PLACES, { ...family, travelType: 'solo', lang });
  assert.ok(
    !localized.summary.includes('solo') || lang === 'en',
    `в сводке на ${lang} не должно быть сырого ключа «solo»: ${localized.summary}`,
  );
  assert.ok(
    localized.summary.includes(TRAVEL_TYPE_LABEL.solo[lang]),
    `в сводке на ${lang} формат поездки должен быть подписан словом`,
  );
}
const soloGuideWhy = matchGuides(GUIDES, { ...baseQuery, travelType: 'solo' })[0].why;
assert.ok(
  !soloGuideWhy.includes('«solo»'),
  `в объяснении подбора не должно быть сырого ключа: ${soloGuideWhy}`,
);

// маршрут короче запрошенного — это надо сказать, иначе выглядит как поломка
const short = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  regions: ['nurata'],
  days: 6,
});
assert.ok(short.days.length < 6, 'в Нурате объектов на шесть дней не наберётся');
assert.ok(
  short.summary.includes('короче запрошенных 6'),
  `короткий маршрут должен объяснять, что запрошено было больше: ${short.summary}`,
);
assert.ok(
  !buildItinerary(PLACES, { ...family, travelType: 'solo', days: 1 }).summary.includes('короче'),
  'когда дней хватило, оговорки быть не должно',
);

// «Совпадает с вашими интересами» под каждым объектом подряд читается как шум
const noisy = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 2 });
for (const day of noisy.days) {
  const repeats = day.items.filter((i) => i.note.includes('Совпадает с вашими интересами')).length;
  assert.ok(repeats <= 1, `в дне ${day.day} причина про интересы повторяется ${repeats} раз`);
}

// --- часы работы и бюджет ---

const timed = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 3 });
assert.ok(
  timed.days[0].items.every((i) => /^\d{2}:\d{2}$/.test(i.at ?? '')),
  'у каждого объекта должно быть время осмотра',
);
assert.equal(timed.days[0].items[0].at, '09:00', 'день без переезда начинается в 9:00');
assert.ok(
  timed.days[0].items.every((i) => !i.closed),
  'в обычном дневном маршруте закрытых объектов быть не должно',
);
// день с переездом стартует позже: сначала дорога
const withTransfer = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  region: 'all',
  regions: [],
  days: 7,
}).days.find((d) => d.transfer);
assert.ok(withTransfer, 'страновой маршрут содержит день с переездом');
assert.ok(
  withTransfer!.items[0].at! > '09:00',
  `после переезда осмотр начинается позже 9:00, а получили ${withTransfer!.items[0].at}`,
);

assert.ok(timed.cost, 'у маршрута должна быть оценка стоимости');
const ticketsSum = timed.days
  .flatMap((d) => d.items)
  .reduce((sum, i) => sum + (PLACES.find((p) => p.id === i.placeId)?.ticketUsd ?? 0), 0);
assert.equal(timed.cost!.ticketsUsd, Math.round(ticketsSum), 'билеты считаются по объектам плана');
assert.equal(
  timed.cost!.totalUsd,
  timed.cost!.ticketsUsd + timed.cost!.transferUsd,
  'итог — сумма билетов и дороги',
);

// новые голосовые: несколько регионов сразу
const twoRegions = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  regions: ['samarkand', 'bukhara'],
  days: 5,
});
const twoRegionCities = new Set(
  twoRegions.days.flatMap((d) => d.items.map((i) => cityOf(i.placeId))),
);
assert.deepEqual(
  [...twoRegionCities].sort(),
  ['bukhara', 'samarkand'],
  'выбраны два региона — в маршруте должны быть оба и только они',
);

// самолёт появляется там, где летают, и обгоняет поезд по времени
const toKhiva = buildTransfer('tashkent', 'khiva', 740);
assert.equal(toKhiva.options[0].mode, 'plane', 'до Хивы быстрее лететь, чем ехать 14 часов поездом');
assert.ok(
  toKhiva.options.some((o) => o.mode === 'bus'),
  'автобус должен быть в вариантах как самый дешёвый',
);
assert.equal(planeLeg('samarkand', 'shakhrisabz'), null, 'между соседними городами рейсов нет');

// рейтинг гида по объектам: общий балл высокий, а нужный объект знает плохо
const byPlaceStats = {
  g5: {
    'khast-imam': { confirmed: 11, refuted: 0, unclear: 0 },
    registan: { confirmed: 1, refuted: 9, unclear: 0 },
  },
};
const onRegistan = matchGuides(GUIDES, {
  ...baseQuery,
  regions: ['samarkand'],
  accuracyByPlace: byPlaceStats,
  placeIds: ['registan'],
}, 10);
const onKhastImam = matchGuides(GUIDES, {
  ...baseQuery,
  regions: ['tashkent'],
  accuracyByPlace: byPlaceStats,
  placeIds: ['khast-imam'],
}, 10);
const g5on = (list: ScoredGuide[]) => list.find((g) => g.guide.id === 'g5')?.score ?? 0;
assert.ok(
  g5on(onKhastImam) > g5on(onRegistan),
  'один и тот же гид должен цениться выше там, где его факты подтверждаются',
);
assert.ok(
  onRegistan.find((g) => g.guide.id === 'g5')?.why.includes('10%'),
  'в объяснении видна точность именно по объектам маршрута',
);

// §9 ТЗ: метка «подтверждён» должна опираться на конкретные проверки,
// а непроверенный гид не должен иметь ни лицензии, ни записи в реестре
for (const guide of GUIDES) {
  if (guide.verified) {
    assert.ok(guide.verification.license, `у подтверждённого гида ${guide.name} должна быть лицензия`);
    assert.ok(guide.verification.registry, `подтверждённый гид ${guide.name} должен быть в реестре`);
    assert.ok(guide.verification.checkedAt, `у подтверждения ${guide.name} должна быть дата`);
  } else {
    assert.equal(guide.verification.license, null, `непроверенный гид ${guide.name} без лицензии`);
    assert.equal(guide.verification.registry, false, `непроверенный гид ${guide.name} вне реестра`);
  }
}

// отзыв с записи 1: у каждого гида есть отзывы, и их текст переводится
for (const guide of GUIDES) {
  assert.ok(guide.reviewsList.length >= 2, `у гида ${guide.name} должно быть минимум два отзыва`);
  for (const review of guide.reviewsList) {
    assert.ok(
      REVIEW_TEMPLATE[review.templateId],
      `отзыв ссылается на несуществующий шаблон: ${review.templateId}`,
    );
    for (const lang of LANGS) {
      assert.ok(REVIEW_TEMPLATE[review.templateId][lang]?.length, `отзыв без перевода на ${lang}`);
    }
  }
}

// --- авторизация ---
const stored = hashPassword('nexus30');
assert.ok(verifyPassword('nexus30', stored), 'верный пароль принимается');
assert.ok(!verifyPassword('nexus31', stored), 'неверный пароль отклоняется');
assert.notEqual(hashPassword('nexus30'), stored, 'у одинаковых паролей разная соль');

const token = signSession({ email: 'admin@nexus30.uz', role: 'admin' });
const session = verifySession(token);
assert.equal(session?.role, 'admin', 'своя подпись читается обратно');

const [body, signature] = token.split('.');
assert.equal(verifySession(`${body}x.${signature}`), null, 'подменённый payload отвергается');
assert.equal(verifySession(`${body}.${signature}x`), null, 'подменённая подпись отвергается');
assert.equal(verifySession(undefined), null, 'без cookie сессии нет');
assert.equal(
  verifySession(token, Date.now() + 8 * 24 * 60 * 60 * 1000),
  null,
  'просроченная сессия отвергается',
);
// подделка ролью: пользователь не может дописать себе admin, не зная секрета
const forged = Buffer.from(
  JSON.stringify({ email: 'user@example.com', role: 'admin', exp: Date.now() + 1000 }),
).toString('base64url');
assert.equal(verifySession(`${forged}.${signature}`), null, 'подделка роли не проходит');

// --- полнота словаря ---
// Больше трёхсот ключей заводились руками. Один забытый язык — и на сцене
// в узбекском интерфейсе всплывает русская строка. Держим это тестом.
{
  const dictionary = UI as Record<string, Record<string, string>>;
  const keys = Object.keys(dictionary);
  assert.ok(keys.length > 250, `словарь подозрительно мал: ${keys.length} ключей`);
  const broken: string[] = [];
  for (const key of keys) {
    for (const lang of LANGS) {
      if (!dictionary[key]?.[lang]?.trim()) broken.push(`${key}.${lang}`);
    }
  }
  assert.deepEqual(broken, [], `ключи без перевода: ${broken.join(', ')}`);
}

// --- сезонность ---
assert.equal(seasonFor('2026-03-01'), 'ramadan', 'начало марта 2026 — Рамадан');
assert.equal(seasonFor('2026-03-21'), 'eid', 'после Рамадана идёт праздник');
assert.equal(seasonFor('2026-07-15'), null, 'обычный июльский день');
assert.ok(seasonNote('2026-03-01', 'ru')?.includes('Рамадан'), 'подпись называет сезон');
for (const lang of LANGS) {
  assert.ok(seasonNote('2026-03-21', lang)?.length, `подпись сезона есть на ${lang}`);
}
assert.ok(
  seasonBudgetFactor('2026-03-21') < seasonBudgetFactor('2026-07-15'),
  'в праздники осмотра меньше: учреждения работают короче',
);
// в 2026 году Ураза-байрам и Навруз совпадают — показываем оба, а не первый попавшийся
assert.deepEqual(
  seasonsFor('2026-03-21').sort(),
  ['eid', 'navruz'],
  'совпавшие праздники должны быть оба',
);
assert.ok(
  seasonNote('2026-03-21', 'ru')?.includes('Навруз'),
  'подпись должна называть оба праздника, а не только первый',
);

// Поправка должна не просто существовать, а доезжать до маршрута: в праздник
// учреждения работают короче, значит объектов в день влезает меньше.
{
  const base = { ...family, travelType: 'solo' as const, days: 1 };
  const holiday = buildItinerary(PLACES, { ...base, startDate: '2026-03-21' });
  const ordinary = buildItinerary(PLACES, { ...base, startDate: '2026-07-15' });
  const minutes = (it: typeof holiday) =>
    it.days[0].items.reduce(
      (sum, i) => sum + PLACES.find((p) => p.id === i.placeId)!.visitMinutes,
      0,
    );
  assert.ok(
    minutes(holiday) < minutes(ordinary),
    `в праздник осмотра должно быть меньше: ${minutes(holiday)} против ${minutes(ordinary)}`,
  );
}

// --- голосовой ввод контекста ---
{
  const ru = parseTripPhrase('хочу в Самарканд на три дня, интересует история');
  assert.deepEqual(ru.regions, ['samarkand'], 'регион из фразы');
  assert.equal(ru.days, 3, 'число словом');
  assert.deepEqual(ru.interests, ['history'], 'интерес из фразы');

  const uz = parseTripPhrase('Buxoro va Xiva, 5 kun, oila bilan');
  assert.deepEqual(uz.regions?.sort(), ['bukhara', 'khiva'], 'два региона на узбекском');
  assert.equal(uz.days, 5, 'число цифрой');
  assert.equal(uz.travelType, 'family', 'формат поездки');
  assert.equal(uz.region, 'all', 'два региона — это уже не один город');

  const en = parseTripPhrase('Bukhara for two days, architecture and food');
  assert.equal(en.days, 2, 'число словом по-английски');
  assert.deepEqual(en.interests?.sort(), ['architecture', 'food'], 'два интереса');

  // мусор не должен менять контекст молча
  assert.deepEqual(parseTripPhrase('привет как дела'), {}, 'из мусора ничего не берём');
  // за границей допустимого числа дней значение игнорируем
  assert.equal(parseTripPhrase('Самарканд на 90 дней').days, undefined, '90 дней — не поездка');
}

// --- темп, исключения и закрепление ---

// темп меняет бюджет дня: спокойный вмещает меньше, насыщенный больше
const relaxed = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 1, pace: 'relaxed' });
const packed = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 1, pace: 'packed' });
const dayMinutes = (it: typeof relaxed) =>
  it.days[0].items.reduce(
    (sum, i) => sum + PLACES.find((p) => p.id === i.placeId)!.visitMinutes,
    0,
  );
assert.ok(
  dayMinutes(packed) > dayMinutes(relaxed),
  `насыщенный день должен вмещать больше осмотра: ${dayMinutes(packed)} против ${dayMinutes(relaxed)}`,
);

// исключённый объект не появляется в маршруте, даже если идеально подходит
const withoutRegistan = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  excluded: ['registan'],
});
assert.ok(
  !withoutRegistan.days.flatMap((d) => d.items).some((i) => i.placeId === 'registan'),
  'убранный руками объект не должен возвращаться в маршрут',
);

// закреплённый объект попадает в маршрут, даже когда фильтр формата против него:
// это осознанный выбор человека, а не промах алгоритма
const pinnedShahiZinda = buildItinerary(PLACES, {
  ...family,
  travelType: 'family',
  pinned: ['shahi-zinda'],
});
assert.ok(
  pinnedShahiZinda.days.flatMap((d) => d.items).some((i) => i.placeId === 'shahi-zinda'),
  'закреплённый объект должен попадать в маршрут вопреки семейному фильтру',
);

// --- погода ---

// норма считается для любой даты и без сети
const julyNorm = climateNorm('bukhara', '2026-07-15');
assert.equal(julyNorm.source, 'norm', 'без прогноза источник — норма');
assert.ok(julyNorm.tMaxC >= 35, `в июле в Бухаре жарко, а получили ${julyNorm.tMaxC}`);
assert.equal(
  climateNorm('khiva', '2027-01-05').source,
  'norm',
  'дата за горизонтом прогноза тоже даёт норму, а не ошибку',
);
assert.equal(adviceFor(julyNorm), 'heat', 'июльская норма Бухары — это жара');
assert.equal(
  adviceFor({ date: '2026-03-01', region: 'tashkent', tMaxC: 16, precipMm: 5, source: 'norm' }),
  'rain',
  'осадки важнее температуры',
);
assert.equal(
  adviceFor({ date: '2026-01-10', region: 'khiva', tMaxC: 3, precipMm: 0, source: 'norm' }),
  'short-day',
  'мороз — короткий световой день',
);

const bukharaCtx: TripContext = {
  ...family,
  travelType: 'solo',
  region: 'bukhara',
  regions: ['bukhara'],
  days: 2,
};
const plain = buildItinerary(PLACES, bukharaCtx);
const hotWeather: DayWeather[] = plain.days.map((_, i) => ({
  date: `2026-07-1${i}`,
  region: 'bukhara',
  tMaxC: 41,
  precipMm: 0,
  source: 'forecast',
}));
const hot = buildItinerary(PLACES, bukharaCtx, hotWeather);

const outdoorOf = (id: string) => PLACES.find((p) => p.id === id)!.outdoor;
assert.ok(
  outdoorOf(hot.days[0].items[0].placeId),
  'в жару день начинается с объекта под открытым небом — по утренней прохладе',
);
assert.ok(hot.days[0].weatherNote?.includes('41'), 'причина перестановки называет температуру');
assert.equal(hot.days[0].weather?.source, 'forecast', 'источник погоды виден в дне');

// Дождь проверяем на Самарканде: там есть и крытые объекты, и открытые.
// В Бухаре демо-датасет целиком под открытым небом, и переставлять там нечего —
// это ограничение данных, а не правила.
const samarkandCtx: TripContext = { ...family, travelType: 'solo', days: 2 };
const dryPlan = buildItinerary(PLACES, samarkandCtx);
const rainWeather: DayWeather[] = dryPlan.days.map((_, i) => ({
  date: `2026-03-1${i}`,
  region: 'samarkand',
  tMaxC: 18,
  precipMm: 6,
  source: 'forecast',
}));
const rainy = buildItinerary(PLACES, samarkandCtx, rainWeather);
assert.ok(
  !outdoorOf(rainy.days[0].items[0].placeId),
  'в дождь день начинается с крытого объекта',
);
assert.ok(rainy.days[0].weatherNote?.includes('6'), 'причина дождя называет миллиметры');

// Город, где всё под открытым небом: дождь не должен оставить турист без плана.
const rainInBukhara = buildItinerary(
  PLACES,
  bukharaCtx,
  plain.days.map((_, i) => ({
    date: `2026-03-1${i}`,
    region: 'bukhara' as const,
    tMaxC: 18,
    precipMm: 6,
    source: 'forecast' as const,
  })),
);
assert.equal(
  rainInBukhara.days.flatMap((d) => d.items).length,
  plain.days.flatMap((d) => d.items).length,
  'если крытых объектов в городе нет, дождь всё равно не выбрасывает открытые',
);

// ГЛАВНОЕ правило: погода меняет порядок и бюджет, но НЕ состав.
// Иначе турист, приехавший ради Регистана, получит план без Регистана.
const idsOf = (it: typeof plain) =>
  new Set(it.days.flatMap((d) => d.items.map((i) => i.placeId)));
assert.deepEqual(idsOf(hot), idsOf(plain), 'жара не должна выкидывать объекты из маршрута');
assert.deepEqual(
  idsOf(rainy),
  idsOf(dryPlan),
  'дождь не должен выкидывать объекты из маршрута',
);
assert.equal(
  hot.days.length,
  plain.days.length,
  'число дней от погоды не меняется',
);

// даты поездки: обе включительно, считаются от старта
const dates = tripDates(3, '2026-09-01');
assert.deepEqual(dates, ['2026-09-01', '2026-09-02', '2026-09-03'], 'даты идут подряд от старта');
assert.equal(tripDates(2).length, 2, 'без стартовой даты план всё равно получает даты');

// --- время намаза ---
const june = prayerTimes('tashkent', '2026-06-21');
const december = prayerTimes('tashkent', '2026-12-21');
const asMinutes = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
for (const times of [june, december]) {
  const order = [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha].map(asMinutes);
  assert.ok(
    order.every((m, i) => i === 0 || order[i - 1] < m),
    `намазы должны идти по возрастанию: ${JSON.stringify(times)}`,
  );
  assert.ok(
    order.every((m) => m >= 0 && m < 1440),
    'время суток не может выходить за границы суток',
  );
}
// в июне день длиннее: закат позже, чем в декабре
assert.ok(
  asMinutes(june.maghrib) > asMinutes(december.maghrib) + 120,
  'летний закат должен быть заметно позже зимнего',
);
// зухр около солнечного полудня Ташкента (UTC+5, долгота 69°) — примерно 12:25
assert.ok(
  Math.abs(asMinutes(june.dhuhr) - 12 * 60 - 25) < 20,
  `зухр должен быть около солнечного полудня, а получили ${june.dhuhr}`,
);
assert.deepEqual(
  prayersDuring(june, '12:00', 60),
  ['dhuhr'],
  'осмотр с 12:00 на час накрывает зухр',
);
assert.deepEqual(prayersDuring(june, '09:00', 60), [], 'утренний осмотр намаз не задевает');

// --- спорные темы ---
// ловится на всех трёх языках, потому что идёт через ту же токенизацию
for (const claim of [
  'Высота минарета Калян 46 метров',
  'Kalon minorasining balandligi qancha',
  'the height of the Kalyan minaret',
]) {
  const topic = findDisputed(claim);
  assert.ok(topic, `спорная тема должна находиться по: ${claim}`);
  assert.ok(topic!.positions.length >= 2, 'у спорной темы минимум две позиции');
}
assert.equal(findDisputed('Где поесть плов'), null, 'обычный вопрос спорной темой не считается');
for (const lang of LANGS) {
  const view = disputedForLang(findDisputed('высота минарета Калян')!, lang);
  assert.ok(view.note.length > 0, `пояснение спорной темы не пустое на ${lang}`);
  assert.ok(
    view.positions.every((p) => p.claim.length > 0 && p.title.length > 0 && p.url.startsWith('http')),
    `у каждой позиции есть текст и источник на ${lang}`,
  );
}

// --- экспорт в календарь ---
const ics = itineraryToIcs(
  timed,
  new Map(PLACES.map((p) => [p.id, p])),
  'ru',
  '2026-09-01',
);
assert.ok(ics.startsWith('BEGIN:VCALENDAR'), 'файл календаря начинается заголовком');
assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'), 'и заканчивается им же');
assert.equal(
  (ics.match(/BEGIN:VEVENT/g) ?? []).length,
  timed.days.flatMap((d) => d.items).length,
  'на каждый объект маршрута — одно событие',
);
assert.ok(ics.includes('DTSTART:20260901T0900'), 'первый день стартует в выбранную дату в 9:00');
assert.ok(ics.includes('\r\n'), 'RFC 5545 требует CRLF, иначе часть календарей файл не примет');
// запятые в названии обязаны экранироваться, иначе событие развалится на поля
assert.ok(
  !/SUMMARY:[^\r\n]*[^\\],/.test(ics),
  'запятые внутри названий должны быть экранированы',
);

// --- защита входа от перебора ---
const attackKey = loginKey('admin@nexus30.uz', '10.0.0.1');
assert.ok(!isLockedOut(attackKey), 'до попыток замок открыт');
for (let i = 0; i < 8; i++) noteFailedLogin(attackKey);
assert.ok(isLockedOut(attackKey), 'после восьми неудач вход запирается');
assert.ok(
  !isLockedOut(loginKey('admin@nexus30.uz', '10.0.0.2')),
  'чужой адрес не должен запирать аккаунт целиком',
);
clearLoginAttempts(attackKey);
assert.ok(!isLockedOut(attackKey), 'удачный вход сбрасывает счётчик');
// окно скользящее: старые попытки не держат замок вечно
for (let i = 0; i < 8; i++) noteFailedLogin(attackKey, Date.now() - 20 * 60 * 1000);
assert.ok(!isLockedOut(attackKey), 'попытки двадцатиминутной давности замок не держат');

// --- склонение числительных ---
assert.equal(reviewsLabel(1, 'ru'), 'отзыв');
assert.equal(reviewsLabel(3, 'ru'), 'отзыва');
assert.equal(reviewsLabel(5, 'ru'), 'отзывов');
assert.equal(reviewsLabel(11, 'ru'), 'отзывов', '11 — исключение, не «отзыв»');
assert.equal(reviewsLabel(132, 'ru'), 'отзыва', '132 оканчивается на 2 — «отзыва»');
assert.equal(reviewsLabel(1, 'en'), 'review');
assert.equal(reviewsLabel(2, 'en'), 'reviews');
assert.equal(yearsLabel(3, 'ru'), 'года опыта');
assert.equal(yearsLabel(5, 'ru'), 'лет опыта');
assert.equal(yearsLabel(15, 'ru'), 'лет опыта', '15 — «лет», а не «года»');

// Погода переставляет объекты — время и заголовок обязаны переставиться с ними.
// Ловилось глазами на живом маршруте: день читался «10:30, 09:00, 12:15».
{
  const hot: DayWeather[] = [
    { date: '2026-08-17', region: 'samarkand', tMaxC: 38, precipMm: 0, source: 'forecast' },
    { date: '2026-08-18', region: 'samarkand', tMaxC: 38, precipMm: 0, source: 'forecast' },
  ];
  const heatPlan = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 2 }, hot);
  for (const day of heatPlan.days) {
    const times = day.items.map((i) => i.at ?? '');
    assert.deepEqual(times, [...times].sort(), `день ${day.day}: время обязано идти по возрастанию`);
    const first = PLACES.find((p) => p.id === day.items[0].placeId)!;
    assert.ok(
      day.title.includes(first.name.ru),
      `заголовок дня ${day.day} должен называть первый объект, а не прежний`,
    );
  }
  // и сама перестановка при этом никуда не делась
  for (const day of heatPlan.days) {
    const flags = day.items.map((i) => PLACES.find((p) => p.id === i.placeId)!.outdoor === true);
    assert.deepEqual(
      flags,
      [...flags].sort((a, b) => Number(b) - Number(a)),
      `день ${day.day}: в жару объекты под открытым небом идут раньше крытых`,
    );
  }
}

// --- целостность базы ---
// Одна связная база, а не восемь файлов рядом: ни одной висячей ссылки.
assert.deepEqual(danglingRefs(), [], 'в базе не должно быть ссылок в никуда');
assert.equal(dbPlaces().length, PLACES.length, 'единая точка входа отдаёт те же объекты');
assert.ok(dbPlace('registan'), 'объект достаётся по идентификатору');
assert.equal(dbPlace('нет-такого'), undefined, 'неизвестный объект — undefined, а не падение');
assert.ok(factsFor('registan').length > 0, 'факты объекта достаются через базу');
assert.ok(dbPhoto('registan'), 'снимок объекта достаётся через базу');
assert.ok(
  factsFor('registan').every((f) => f.placeId === 'registan'),
  'выборка фактов не подмешивает чужие объекты',
);

// Накопленное проверяется тоже: удалили гида — его вердикты и счётчики
// повиснут, и раньше это было слепым пятном.
assert.deepEqual(
  danglingRefs({
    guideIds: GUIDES.map((g) => g.id),
    verdicts: [{ id: 'v1', guideId: GUIDES[0].id, placeId: 'registan' }],
    requests: [{ id: 'r1', kind: 'guide-booking', targetId: GUIDES[0].id }],
    users: [{ email: 'a@b.uz', guideId: GUIDES[0].id }],
    accuracyKeys: [GUIDES[0].id, `${GUIDES[0].id}|registan`],
  }),
  [],
  'связные накопленные данные проблем не дают',
);
const broken = danglingRefs({
  guideIds: ['g1'],
  verdicts: [{ id: 'v9', guideId: 'удалённый', placeId: 'нет-объекта' }],
  requests: [{ id: 'r9', kind: 'place-problem', targetId: 'нет-объекта' }],
  users: [{ email: 'x@y.uz', guideId: 'удалённый' }],
  accuracyKeys: ['удалённый|registan'],
});
assert.ok(broken.length >= 5, 'каждая висячая ссылка обязана быть названа отдельно');
assert.ok(
  broken.some((p) => p.includes('вердикт v9')) &&
    broken.some((p) => p.includes('заявка r9')) &&
    broken.some((p) => p.includes('аккаунт x@y.uz')) &&
    broken.some((p) => p.includes('счётчик')),
  'проверка обязана ловить все четыре вида ссылок, а не только вердикты',
);

// --- доступность влияет на маршрут, а не только на значок ---
const accessiblePlan = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  days: 3,
  accessibleOnly: true,
});
assert.ok(
  accessiblePlan.days
    .flatMap((d) => d.items)
    .every((i) => PLACES.find((p) => p.id === i.placeId)?.accessible === true),
  'при выборе «только доступные» в маршрут не попадают недоступные объекты',
);
const pinnedInaccessible = PLACES.find((p) => !p.accessible && p.region === 'samarkand')!;
const withPinned = buildItinerary(PLACES, {
  ...family,
  travelType: 'solo',
  days: 3,
  accessibleOnly: true,
  pinned: [pinnedInaccessible.id],
});
assert.ok(
  withPinned.days.flatMap((d) => d.items).some((i) => i.placeId === pinnedInaccessible.id),
  'закреплённый вручную объект остаётся: это осознанный выбор человека',
);

// --- правила маршрута называются вслух ---
assert.ok((accessiblePlan.rules ?? []).length > 0, 'маршрут обязан объяснить, как он собран');
assert.ok(
  (accessiblePlan.rules ?? []).some((r) => /коляск|aravacha|wheelchair/i.test(r)),
  'выбранный фильтр доступности должен быть назван в правилах',
);
assert.ok(
  (buildItinerary(PLACES, { ...family, travelType: 'solo', days: 2 }).rules ?? []).every(
    (r) => !/коляск/i.test(r),
  ),
  'невыбранное правило не называется — иначе список превращается в шум',
);

// --- ветер ---
// Порядок объектов ветер не меняет: это сведение, а не правило.
const windy: DayWeather = { date: '2026-04-10', region: 'bukhara', tMaxC: 24, precipMm: 0, windKmh: 34, source: 'forecast' };
const calm: DayWeather = { ...windy, windKmh: 8 };
assert.ok(isWindy(windy), `${WINDY_KMH} км/ч и выше — это уже ветрено`);
assert.ok(!isWindy(calm), 'восемь километров в час ветром не считаются');
assert.ok(!isWindy({ ...calm, windKmh: undefined }), 'нет данных о ветре — не выдумываем');
assert.equal(adviceFor(windy), adviceFor(calm), 'ветер не меняет решение по дню');

// --- значок официальных источников ---
// Он обязан опираться на счёт, а не на желание показать галочку.
const regFacts = officialFactsFor(CORPUS, 'registan');
assert.ok(regFacts.total > 0, 'у Регистана есть факты в корпусе');
assert.ok(regFacts.official > 0 && regFacts.official <= regFacts.total, 'официальных не больше, чем всего');
assert.deepEqual(
  officialFactsFor(CORPUS, 'нет-такого-объекта'),
  { official: 0, total: 0 },
  'у неизвестного объекта значка быть не должно',
);
assert.ok(
  PLACES.some((p) => officialFactsFor(CORPUS, p.id).official === 0),
  'значок стоит не у всех подряд — иначе он ничего не означает',
);

// --- бюджет ---
assert.equal(dailyCapUsd('low'), 24, '300 тысяч сум — это примерно 24 доллара в день');
assert.ok(dailyCapUsd('mid') > dailyCapUsd('low'), 'средний потолок выше экономного');
assert.equal(dailyCapUsd('high'), Infinity, 'у премиума потолка нет');
assert.ok(overBudget(30, 'low'), 'тридцать долларов за день не влезают в экономный бюджет');
assert.ok(!overBudget(30, 'mid'), 'в средний влезают');
assert.ok(!overBudget(500, undefined), 'бюджет не выбран — предупреждать не о чем');

// Поправка решает споры равных, но главное не выкидывает: Регистан за $5
// обязан остаться в маршруте даже у экономного туриста.
assert.ok(budgetScoreBonus(0, 'low') > 0, 'бесплатный объект экономному в плюс');
assert.ok(budgetScoreBonus(5, 'low') < 0, 'платный — в минус');
assert.ok(budgetScoreBonus(5, 'low') > -2, 'но поправка мала: интерес весит больше');
assert.equal(budgetScoreBonus(5, undefined), 0, 'без бюджета поправки нет');

const cheap = buildItinerary(PLACES, { ...family, travelType: 'solo', days: 3, budget: 'low' });
assert.ok(
  cheap.days.flatMap((d) => d.items).some((i) => i.placeId === 'registan'),
  'бюджет не должен выкидывать главный объект города',
);
assert.ok(
  (cheap.cost?.perDayUsd ?? []).length === cheap.days.length,
  'траты считаются по каждому дню — иначе не сказать, какой день вылез',
);
assert.ok(usdToUzsLabel(24, 'ru').includes('сум'), 'сумма показывается в сумах');

// --- языки общения туриста ---
// Узбек может искать англоязычного гида: подбор идёт по выбранным языкам,
// а не по языку интерфейса.
const uzUi: TripContext = { ...family, lang: 'uz', travelType: 'solo' };
const guideQuery = { ...uzUi, gender: 'any' as const, needTransport: false };
const wantEnglish = matchGuides(GUIDES, { ...guideQuery, languages: ['en'] });
const wantUzbek = matchGuides(GUIDES, { ...guideQuery, languages: ['uz'] });
assert.ok(wantEnglish.length > 0 && wantUzbek.length > 0, 'гиды находятся в обоих случаях');
assert.ok(
  wantEnglish[0].guide.languages.includes('en'),
  'первым при запросе английского идёт англоговорящий гид',
);
assert.notDeepEqual(
  wantEnglish.map((g) => g.guide.id),
  wantUzbek.map((g) => g.guide.id),
  'выбор языка обязан менять выдачу, иначе поле бесполезно',
);

// --- фотографии объектов ---
assert.ok(Object.keys(PHOTOS).length >= 25, 'у большинства объектов есть снимок');
for (const [id, photo] of Object.entries(PHOTOS)) {
  assert.ok(PLACES.some((p) => p.id === id), `снимок ${id} привязан к несуществующему объекту`);
  assert.ok(photo.url.startsWith('/photos/'), `${id}: снимок обязан лежать у нас, а не на чужом хосте`);
  assert.ok(photo.author.length > 0 && photo.license.length > 0, `${id}: автор и лицензия обязательны`);
  assert.ok(photo.page.includes('commons.wikimedia.org'), `${id}: ссылка на страницу файла`);
}

// --- маршрут по дорогам ---
const registan = { lat: 39.6547, lng: 66.9749 };
const bibiKhanym = { lat: 39.6606, lng: 66.9797 };
const konigil = { lat: 39.6969, lng: 66.9235 };

assert.ok(
  Math.abs(haversineKm(registan, bibiKhanym) - 0.8) < 0.15,
  'от Регистана до Биби-Ханым около 800 метров',
);

// способ выбирается по расстоянию, время — по способу
const near = legFrom(0.8, 3);
assert.equal(near.mode, 'walk', 'восемьсот метров — это пешком');
assert.equal(near.minutes, 11, '0,8 км при 4,5 км/ч — одиннадцать минут');
assert.equal(near.fareUsd, 0, 'пеший переход бесплатен');

const far = legFrom(6, 12);
assert.equal(far.mode, 'taxi', 'шесть километров пешком никто не пойдёт');
assert.equal(far.minutes, 12, 'машинное время берём у маршрутизатора, а не считаем сами');
assert.ok(far.fareUsd >= 1, 'дешевле доллара поездок не бывает');
assert.ok(taxiFareUsd(0.1) === 1, 'минимальная цена держит нижнюю границу');
assert.ok(taxiFareUsd(20) > taxiFareUsd(5), 'дальше — дороже');

// ответ OSRM разбирается, а мусор — отвергается
const answer = {
  routes: [
    {
      geometry: { coordinates: [[66.97, 39.65], [66.98, 39.66]] },
      legs: [{ distance: 820, duration: 190 }],
    },
  ],
};
const parsed = parseOsrm(answer, 1);
assert.ok(parsed, 'нормальный ответ обязан разобраться');
assert.equal(parsed?.legs[0].mode, 'walk', '820 метров — пешком');
assert.equal(parseOsrm(answer, 2), null, 'переходов меньше, чем точек, — ответ не наш');
assert.equal(parseOsrm({ routes: [] }, 1), null, 'пустой ответ не годится');
assert.equal(parseOsrm('нет', 1), null, 'мусор не должен ронять карту');

// запасной вариант работает без сети и не врёт в меньшую сторону
const straightLine = directRoute([registan, bibiKhanym, konigil]);
assert.equal(straightLine.legs.length, 2, 'у трёх точек два перехода');
assert.equal(straightLine.line.length, 3, 'прямая линия идёт по самим точкам');
assert.ok(
  straightLine.legs[0].km > haversineKm(registan, bibiKhanym),
  'дорога длиннее прямой — оценка обязана это учитывать',
);
assert.equal(straightLine.legs[1].mode, 'taxi', 'до Конигиля пешком не ходят');

// «0 км» — не расстояние: сотня метров должна печататься метрами
assert.deepEqual(distanceLabel(0.045), { value: 50, unit: 'm' }, 'сорок пять метров — это 50 м');
assert.deepEqual(distanceLabel(0.8), { value: 800, unit: 'm' }, 'восемьсот метров — метрами');
assert.deepEqual(distanceLabel(3.24), { value: 3.2, unit: 'km' }, 'от километра — километрами');
assert.equal(distanceLabel(0.001).value, 10, 'ноль метров не показываем даже при совпадении точек');

const legTotals = routeTotals(straightLine.legs);
assert.ok(legTotals.walkKm > 0 && legTotals.taxiUsd > 0, 'в итоге дня есть и пешие, и машинные переходы');
assert.equal(
  routeTotals([]).walkMinutes,
  0,
  'день из одного объекта не должен показывать переходы',
);

assert.ok(
  navigatorUrl([registan, bibiKhanym]).includes('39.65470,66.97490~39.66060,66.97970'),
  'ссылка в навигатор ведёт по тем же точкам и в том же порядке',
);

console.log('OK: retrieval (uz/ru/en), demo-cache, planner, match, маршрут, переводы, авторизация');
