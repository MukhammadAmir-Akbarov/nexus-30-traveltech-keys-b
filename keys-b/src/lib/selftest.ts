// Одна самопроверка на всю нетривиальную логику: поиск по корпусу,
// планировщик и подбор гида. Запуск: npm run check
// (Node 22 сам снимает типы, поэтому импорты — с расширением .ts.)
import assert from 'node:assert/strict';
import { CORPUS } from '../data/corpus.ts';
import { GUIDES } from '../data/guides.ts';
import { PLACES } from '../data/places.ts';
import { lookupDemoVerdict } from '../data/demo-cache.ts';
import { matchGuides } from './match.ts';
import { buildItinerary } from './planner.ts';
import { retrieve } from './retrieval.ts';
import type { TripContext } from './types.ts';

// --- поиск по корпусу ---
const hits = retrieve(CORPUS, 'Когда построен Регистан?', 3);
assert.ok(hits.length > 0, 'поиск обязан что-то найти по Регистану');
assert.equal(hits[0].item.id, 'c01', 'первым должен быть абзац с датами Регистана');

const minaret = retrieve(CORPUS, 'высота минарета Калян', 3);
assert.equal(minaret[0].item.id, 'c16', 'первым должен быть абзац про 46 метров');

assert.deepEqual(retrieve(CORPUS, '???', 3), [], 'мусорный запрос -> пустой результат');

// --- предзаписанные вердикты демо ---
const cached = lookupDemoVerdict('Регистан построен в XII веке');
assert.equal(cached?.status, 'refuted', 'ключевое утверждение демо должно опровергаться');
assert.equal(lookupDemoVerdict('Где поесть плов?'), null, 'вне сценария демо — кэша нет');

// --- планировщик ---
const family: TripContext = {
  region: 'samarkand',
  interests: ['history', 'architecture'],
  travelType: 'family',
  days: 2,
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

console.log('OK: retrieval, demo-cache, planner, match — все проверки прошли');
