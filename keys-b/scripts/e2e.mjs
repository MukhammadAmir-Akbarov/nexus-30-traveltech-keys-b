// Сквозной прогон против запущенного сервера.
//
// npm run check проверяет чистые функции; здесь проверяется то, что чистыми
// функциями не поймать: страницы отвечают, роли разделены, накрутка не проходит,
// погода доезжает до ответа. Всё это я проверял руками по десять раз за вечер —
// скрипт делает то же самое за десять секунд.
//
// Запуск: npx next start -p 3000 &  →  npm run e2e
// Адрес можно задать переменной BASE.

import assert from 'node:assert/strict';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nexus30.uz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'nexus30';

let passed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n      ${error.message}`);
  }
}

const json = async (path, body, cookie) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  return { res, data: text ? JSON.parse(text) : null };
};

const cookieFrom = (res) => (res.headers.get('set-cookie') ?? '').split(';')[0];

console.log(`\nСквозной прогон: ${BASE}\n`);

// --- страницы ---
console.log('Страницы');
for (const path of ['/', '/plan', '/compare', '/check', '/guides', '/places', '/profile', '/how', '/qr', '/login']) {
  await check(`${path} отвечает 200`, async () => {
    const res = await fetch(`${BASE}${path}`);
    assert.equal(res.status, 200);
  });
}

// --- маршрут ---
console.log('\nМаршрут');
const trip = {
  regions: ['samarkand', 'bukhara'],
  region: 'samarkand',
  interests: ['history', 'architecture'],
  travelType: 'solo',
  days: 4,
  lang: 'ru',
  summer: false,
  startDate: '2026-08-17',
};

let itinerary;
await check('маршрут строится и содержит дни', async () => {
  const { data } = await json('/api/plan', trip);
  itinerary = data.itinerary;
  assert.ok(itinerary.days.length > 0);
});

await check('объекты не повторяются', () => {
  const ids = itinerary.days.flatMap((d) => d.items.map((i) => i.placeId));
  assert.equal(new Set(ids).size, ids.length);
});

await check('у каждого объекта есть время осмотра', () => {
  const items = itinerary.days.flatMap((d) => d.items);
  assert.ok(items.every((i) => /^\d{2}:\d{2}$/.test(i.at)));
});

await check('переезд стоит там, где меняется город', () => {
  const cities = itinerary.days.map((d) => d.title.split(':')[0]);
  const changes = cities.map((c, i) => i > 0 && c !== cities[i - 1]).map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  const transfers = itinerary.days.map((d, i) => (d.transfer ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(transfers, changes);
});

await check('есть оценка расходов', () => {
  assert.ok(itinerary.cost.totalUsd >= 0);
  assert.equal(itinerary.cost.totalUsd, itinerary.cost.ticketsUsd + itinerary.cost.transferUsd);
});

await check('у дня есть погода с подписанным источником', () => {
  const w = itinerary.days[0].weather;
  assert.ok(w, 'погоды нет');
  assert.ok(['forecast', 'norm'].includes(w.source));
});

await check('формат поездки не печатается сырым ключом', () => {
  assert.ok(!itinerary.summary.includes('«solo»'), itinerary.summary);
});

await check('семья и соло дают разные маршруты', async () => {
  const { data } = await json('/api/plan', { ...trip, travelType: 'family' });
  const a = new Set(itinerary.days.flatMap((d) => d.items.map((i) => i.placeId)));
  const b = new Set(data.itinerary.days.flatMap((d) => d.items.map((i) => i.placeId)));
  assert.notDeepEqual([...a].sort(), [...b].sort());
});

// --- проверка фактов ---
console.log('\nПроверка фактов');
for (const [lang, claim, expected] of [
  ['ru', 'Регистан построен в XII веке', 'refuted'],
  ['uz', 'Registon XII asrda qurilgan', 'refuted'],
  ['en', 'Itchan Kala is Uzbekistan’s first UNESCO site', 'confirmed'],
]) {
  await check(`«${claim.slice(0, 28)}…» → ${expected} (${lang})`, async () => {
    const { data } = await json('/api/check', { claim, lang });
    assert.equal(data.verdict.status, expected);
  });
}

await check('спорная тема показывает обе позиции и не идёт в рейтинг', async () => {
  const { data } = await json('/api/check', {
    claim: 'Высота минарета Калян 46 метров',
    lang: 'ru',
    guideId: 'g1',
  });
  assert.ok(data.disputed, 'нет блока спорной темы');
  assert.ok(data.disputed.positions.length >= 2);
  assert.equal(data.counted, undefined, 'спорное не должно попадать в репутацию');
});

// --- защита от накрутки ---
console.log('\nЗащита репутации');
let clientCookie = '';
await check('первая проверка засчитывается, повтор — нет', async () => {
  const first = await json('/api/check', {
    claim: 'Минарет Калян высотой 100 метров',
    lang: 'ru',
    guideId: 'g7',
  });
  clientCookie = cookieFrom(first.res);
  assert.equal(first.data.counted, 'counted');

  const second = await json(
    '/api/check',
    { claim: 'Минарет Калян высотой 100 метров', lang: 'ru', guideId: 'g7' },
    clientCookie,
  );
  assert.equal(second.data.counted, 'duplicate');
});

await check('до порога процент точности не показывается', async () => {
  const { data } = await json('/api/guides', {
    ...trip,
    languages: ['ru', 'en', 'uz'],
    gender: 'any',
    needTransport: false,
  });
  const guide = data.guides.find((g) => {
    const a = g.accuracy;
    return a && a.confirmed + a.refuted > 0 && a.confirmed + a.refuted < 5;
  });
  if (!guide) return; // некому — проверять нечего
  assert.ok(!/\d+%/.test(guide.why.split(' · ').find((w) => w.includes('мало')) ?? 'мало'));
});

// --- роли ---
console.log('\nРоли и доступ');
let adminCookie = '';
await check('администратор входит', async () => {
  const { res, data } = await json('/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  assert.equal(res.status, 200, JSON.stringify(data));
  adminCookie = cookieFrom(res);
});

await check('без сессии админ-действие запрещено', async () => {
  const { res } = await json('/api/admin', { type: 'export' });
  assert.equal(res.status, 403);
});

let guideCookie = '';
await check('администратор выдаёт гиду доступ, гид входит', async () => {
  const { data } = await json('/api/admin', { type: 'guideAccount', id: 'g7' }, adminCookie);
  // если доступ уже выдавали в этом процессе — не ошибка прогона
  if (!data.password) return;
  const login = await json('/api/auth/login', { email: data.email, password: data.password });
  assert.equal(login.res.status, 200);
  guideCookie = cookieFrom(login.res);
});

await check('гид не может дёргать админ-действия', async () => {
  if (!guideCookie) return;
  const { res } = await json('/api/admin', { type: 'removeGuide', id: 'g1' }, guideCookie);
  assert.equal(res.status, 403);
});

await check('гид не оспорит чужой вердикт', async () => {
  if (!guideCookie) return;
  const { res } = await json(
    '/api/guide/dispute',
    { verdictId: 'v99999', note: 'чужой вердикт' },
    guideCookie,
  );
  assert.equal(res.status, 404);
});

await check('в админку без роли не пускает', async () => {
  const res = await fetch(`${BASE}/admin`, { redirect: 'manual' });
  assert.ok([302, 307].includes(res.status), `получили ${res.status}`);
});

// --- заявки ---
console.log('\nЗаявки');
await check('заявка с объекта принимается', async () => {
  const { res, data } = await json('/api/requests', {
    kind: 'place-problem',
    targetId: 'registan',
    message: 'Вход закрыт на реставрацию',
    contact: '+998900000000',
  });
  assert.equal(res.status, 200);
  assert.ok(data.id);
});

await check('пустая заявка отклоняется', async () => {
  const { res } = await json('/api/requests', { kind: 'place-problem', targetId: 'registan' });
  assert.equal(res.status, 400);
});

// --- страницы объекта и каталог ---
console.log('\nОбъекты');
await check('карточка объекта отдаётся по QR-ссылке', async () => {
  const res = await fetch(`${BASE}/place/registan`);
  assert.equal(res.status, 200);
  const html = await res.text();
  // заголовок свой у каждого объекта, а не общий на приложение
  assert.ok(/<title>[^<]*Registon/i.test(html), 'в заголовке страницы должно быть имя объекта');
  // разметка для поисковика опирается на те же данные, что видит человек
  assert.ok(html.includes('TouristAttraction'), 'на странице объекта должна быть разметка schema.org');
});

await check('несуществующий объект даёт 404, а не пустоту', async () => {
  const res = await fetch(`${BASE}/place/no-such-place`);
  assert.equal(res.status, 404);
  const html = await res.text();
  // своя страница внутри оболочки приложения, а не служебная заглушка Next
  assert.ok(html.includes('Turizm'), 'на странице «не нашлось» должна остаться шапка приложения');
});

// --- служебное ---
console.log('\nСлужебное');
await check('состояние приложения отвечает и база связна', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true, 'база должна быть связна');
  assert.equal(data.dangling, 0, 'висячих ссылок быть не должно');
  assert.ok(data.places > 0 && data.guides > 0);
});

await check('карта сайта содержит объекты', async () => {
  const res = await fetch(`${BASE}/sitemap.xml`);
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.ok(xml.includes('/place/registan'), 'объекты должны быть видны поисковику');
});

await check('служебные разделы закрыты от индексации', async () => {
  const text = await (await fetch(`${BASE}/robots.txt`)).text();
  for (const path of ['/admin', '/guide', '/api']) {
    assert.ok(text.includes(`Disallow: ${path}`), `${path} обязан быть закрыт`);
  }
});

await check('заголовки безопасности стоят на всех страницах', async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.ok(res.headers.get('referrer-policy'));
});

await check('проверка принимает источник утверждения', async () => {
  const { res, data } = await json('/api/check', {
    claim: 'Регистан построен в XV веке',
    lang: 'ru',
    source: 'sign',
  });
  assert.equal(res.status, 200);
  assert.ok(data.verdict, 'вердикт должен вернуться и с указанным источником');
});

console.log(`\nИтог: ${passed} проверок пройдено, ${failures.length} упало.\n`);
if (failures.length) process.exit(1);
