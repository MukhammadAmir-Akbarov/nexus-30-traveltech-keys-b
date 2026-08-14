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
const guides = matchGuides(GUIDES, { ...family, language: 'en' });
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
  const localized = matchGuides(GUIDES, { ...family, lang, language: 'en' });
  assert.ok(localized[0].why.length > 0, `объяснение подбора не пустое на ${lang}`);
}

console.log('OK: retrieval (uz/ru/en), demo-cache, planner, match, полнота переводов');
