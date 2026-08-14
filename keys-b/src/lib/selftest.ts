// Одна самопроверка на всю нетривиальную логику: поиск по корпусу,
// планировщик, подбор гида и трёхъязычность. Запуск: npm run check
// (Node 22 сам снимает типы, поэтому импорты — с расширением .ts.)
import assert from 'node:assert/strict';
import { CORPUS } from '../data/corpus.ts';
import { GUIDES } from '../data/guides.ts';
import { PLACES } from '../data/places.ts';
import { lookupDemoVerdict } from '../data/demo-cache.ts';
import { matchGuides } from './match.ts';
import { buildItinerary } from './planner.ts';
import { retrieve } from './retrieval.ts';
import { GUIDE_LANGS, REVIEW_TEMPLATE } from './i18n.ts';
import { hashPassword, signSession, verifyPassword, verifySession } from './auth.ts';
import type { Lang, TripContext } from './types.ts';

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
  interests: ['history', 'architecture'],
  travelType: 'family',
  days: 2,
  lang: 'ru',
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
assert.ok(
  country.days.filter((d) => d.transfer).length >= 2,
  'между городами должны появляться переезды с временем в пути',
);
assert.ok(
  country.days.every((d) => new Set(d.items.map((i) => cityOf(i.placeId))).size === 1),
  'в одном дне объекты только одного города',
);

// интересы не совпали, но регион выбран -> показываем объекты региона, а не пустоту
const fallback = buildItinerary(PLACES, { ...family, region: 'khiva', interests: ['food'] });
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

// отзыв с записи 5: узбекский обязателен, и языков должно быть больше трёх
assert.ok(
  GUIDE_LANGS.includes('uz') && GUIDE_LANGS.length >= 8,
  'список языков гидов включает узбекский и не ограничен тремя',
);
assert.ok(
  GUIDES.some((g) => g.languages.includes('fr')) && GUIDES.some((g) => g.languages.includes('it')),
  'в базе есть гиды с французским и итальянским',
);

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

console.log('OK: retrieval (uz/ru/en), demo-cache, planner, match, переводы, авторизация');
