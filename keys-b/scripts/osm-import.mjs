// Импорт инфраструктуры из OpenStreetMap.
//
// Запуск: node scripts/osm-import.mjs [--city=khiva] [--dry]
// Результат: src/data/poi-osm.ts — сгенерированный файл, который коммитится
// в репозиторий вместе с кодом.
//
// Почему разовый скрипт, а не запрос во время работы приложения:
//  - Overpass регулярно недоступен (за эту неделю лежал часами), и ставить
//    показ туалетов в зависимость от чужого сервера — значит терять их
//    ровно тогда, когда турист стоит на улице и они нужны;
//  - данные в репозитории видно в ревью: «откуда взялся этот банкомат»
//    имеет ответ в истории, а не в чьей-то памяти;
//  - офлайн-режим приложения перестал бы работать.
//
// Обратная сторона честная: данные устаревают между импортами, поэтому
// каждая запись несёт дату получения, а интерфейс её показывает.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DRY = process.argv.includes('--dry');
const ONLY = process.argv.find((a) => a.startsWith('--city='))?.split('=')[1];
const OUT = 'src/data/poi-osm.ts';
const CACHE = '.data/osm-cache';

/**
 * Города и рамки выборки. Рамки узкие намеренно: нас интересует то, до чего
 * турист дойдёт пешком от объектов, а не вся административная область.
 * [юг, запад, север, восток] — порядок Overpass.
 */
const CITIES = {
  tashkent: { region: 'tashkent', bbox: [41.28, 69.19, 41.35, 69.31] },
  samarkand: { region: 'samarkand', bbox: [39.62, 66.92, 39.68, 67.01] },
  khiva: { region: 'khorezm', bbox: [41.35, 60.33, 41.41, 60.40] },
  urgench: { region: 'khorezm', bbox: [41.52, 60.58, 41.58, 60.68] },
  bukhara: { region: 'bukhara', bbox: [39.74, 64.39, 39.80, 64.45] },
};

/**
 * Соответствие тегов OSM нашим типам. Слева — то, как размечает мир,
 * справа — то, что ищет турист.
 */
const AMENITY = {
  toilets: 'toilet',
  fuel: 'gas',
  atm: 'atm',
  bank: 'bank',
  pharmacy: 'pharmacy',
  hospital: 'hospital',
  clinic: 'clinic',
  doctors: 'clinic',
  parking: 'parking',
  cafe: 'cafe',
  restaurant: 'restaurant',
  fast_food: 'restaurant',
  place_of_worship: 'prayer',
  drinking_water: 'water',
};

const SHOP = {
  supermarket: 'shop',
  convenience: 'shop',
  mall: 'shop',
  greengrocer: 'shop',
};

/**
 * Сколько записей одного типа оставляем на город. Без потолка Ташкент даёт
 * сотни банкоматов, и список превращается в свалку, в которой ближайший
 * не найти. Отбор — по расстоянию до центра выборки.
 */
const PER_KIND = 12;

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const today = new Date().toISOString().slice(0, 10);

function query(bbox) {
  const b = bbox.join(',');
  const amenities = Object.keys(AMENITY).join('|');
  const shops = Object.keys(SHOP).join('|');
  return `[out:json][timeout:90];(
    node["amenity"~"^(${amenities})$"](${b});
    node["shop"~"^(${shops})$"](${b});
    way["amenity"~"^(${amenities})$"](${b});
  );out center tags;`;
}

async function fetchCity(city, bbox) {
  mkdirSync(CACHE, { recursive: true });
  const cached = `${CACHE}/${city}.json`;
  // Кэш не для скорости, а из уважения к чужому бесплатному серверу:
  // повторный прогон скрипта не должен снова его нагружать.
  if (existsSync(cached)) {
    console.log(`  ${city}: из кэша`);
    return JSON.parse(readFileSync(cached, 'utf8'));
  }

  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Без своего User-Agent Overpass отвечает 406: стандартный заголовок
          // Node он считает ботом. Поймано измерением — тот же запрос из curl
          // проходил, из fetch нет.
          'User-Agent': 'nexus30-turizmhamroh/1.0 (OSM import for a hackathon prototype)',
        },
        body: new URLSearchParams({ data: query(bbox) }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trimStart().startsWith('{')) throw new Error('сервер занят');
      const json = JSON.parse(text);
      writeFileSync(cached, JSON.stringify(json), 'utf8');
      console.log(`  ${city}: ${json.elements.length} элементов (${new URL(url).host})`);
      return json;
    } catch (error) {
      console.log(`  ${city}: ${new URL(url).host} — ${error.message}`);
    }
  }
  return null;
}

/** Название на трёх языках. Чего нет — подставляем ближайшее, а не пустую строку. */
function names(tags, kind) {
  const uz = tags['name:uz'] || tags.name;
  const ru = tags['name:ru'] || tags.name;
  const en = tags['name:en'] || tags['name:latin'] || tags.name;
  if (uz || ru || en) {
    return { uz: uz || ru || en, ru: ru || uz || en, en: en || uz || ru };
  }
  // Безымянный туалет — всё ещё туалет: подписываем типом, а не пропускаем.
  return GENERIC[kind];
}

const GENERIC = {
  toilet: { uz: 'Hojatxona', ru: 'Туалет', en: 'Toilet' },
  gas: { uz: 'Zapravka', ru: 'Заправка', en: 'Fuel station' },
  atm: { uz: 'Bankomat', ru: 'Банкомат', en: 'ATM' },
  bank: { uz: 'Bank', ru: 'Банк', en: 'Bank' },
  pharmacy: { uz: 'Dorixona', ru: 'Аптека', en: 'Pharmacy' },
  hospital: { uz: 'Shifoxona', ru: 'Больница', en: 'Hospital' },
  clinic: { uz: 'Tibbiy punkt', ru: 'Медпункт', en: 'Clinic' },
  parking: { uz: 'Avtoturargoh', ru: 'Парковка', en: 'Parking' },
  cafe: { uz: 'Kafe', ru: 'Кафе', en: 'Cafe' },
  restaurant: { uz: 'Restoran', ru: 'Ресторан', en: 'Restaurant' },
  shop: { uz: 'Do‘kon', ru: 'Магазин', en: 'Shop' },
  prayer: { uz: 'Namozxona', ru: 'Молельная', en: 'Prayer room' },
  water: { uz: 'Ichimlik suvi', ru: 'Питьевая вода', en: 'Drinking water' },
};

function kindOf(tags) {
  if (tags.amenity === 'place_of_worship' && tags.religion && tags.religion !== 'muslim') {
    // намазхона — это про ислам; чужой храм в этот список ставить неверно
    return null;
  }
  return AMENITY[tags.amenity] ?? SHOP[tags.shop] ?? null;
}

function fuelOf(tags) {
  if (tags['fuel:cng'] === 'yes' || tags['fuel:lpg'] === 'yes') return 'methane';
  if (tags['fuel:octane_92'] === 'yes' || tags['fuel:octane_95'] === 'yes') return 'petrol';
  return undefined;
}

const km = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
  return 2 * R * Math.asin(Math.sqrt(h));
};

async function main() {
  const entries = Object.entries(CITIES).filter(([city]) => !ONLY || city === ONLY);
  const out = [];

  for (const [city, { region, bbox }] of entries) {
    const data = await fetchCity(city, bbox);
    if (!data) continue;

    const centre = { lat: (bbox[0] + bbox[2]) / 2, lng: (bbox[1] + bbox[3]) / 2 };
    const byKind = new Map();

    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const kind = kindOf(tags);
      if (!kind) continue;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      const item = {
        id: `osm-${el.type[0]}${el.id}`,
        kind,
        ...(kind === 'gas' && fuelOf(tags) ? { fuel: fuelOf(tags) } : {}),
        name: names(tags, kind),
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
        region,
        cityId: city,
        ...(tags.opening_hours ? { hoursRaw: tags.opening_hours } : {}),
        ...(tags.wheelchair === 'yes' || tags.wheelchair === 'limited' || tags.wheelchair === 'no'
          ? { wheelchair: tags.wheelchair }
          : {}),
        ...(tags.phone || tags['contact:phone']
          ? { phone: (tags.phone ?? tags['contact:phone']).slice(0, 40) }
          : {}),
        src: 'osm',
        at: today,
      };

      const list = byKind.get(kind) ?? [];
      list.push({ item, d: km(centre, { lat, lng }) });
      byKind.set(kind, list);
    }

    for (const [kind, list] of byKind) {
      const picked = list.sort((a, b) => a.d - b.d).slice(0, PER_KIND);
      out.push(...picked.map((p) => p.item));
      console.log(`    ${kind.padEnd(11)} ${picked.length}/${list.length}`);
    }
  }

  out.sort((a, b) => a.id.localeCompare(b.id));

  const header = `// СГЕНЕРИРОВАННЫЙ ФАЙЛ — не править руками.
// Источник: OpenStreetMap (ODbL). Получено: ${today}.
// Обновить: node scripts/osm-import.mjs   (кэш ответов — .data/osm-cache)
//
// Записи несут src и at: интерфейс показывает, откуда сведения и когда
// их забрали, а не выдаёт вчерашний снимок за сегодняшнее состояние.

import type { Poi } from '../lib/types.ts';

export const POIS_OSM: Poi[] = ${JSON.stringify(out, null, 2)};
`;

  console.log(`\nВсего: ${out.length} записей`);
  if (DRY) {
    console.log('(--dry: файл не записан)');
    return;
  }
  // Пустой результат — это упавший импорт, а не «в городах ничего нет».
  // Записать его значит тихо стереть данные, которые уже лежат в репозитории.
  if (out.length === 0) {
    console.error('Ничего не получено — файл не трогаю, чтобы не стереть прежние данные.');
    process.exitCode = 1;
    return;
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, header, 'utf8');
  console.log(`Записано: ${OUT}`);
}

await main();
