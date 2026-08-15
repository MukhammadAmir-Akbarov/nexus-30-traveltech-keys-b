// Фотографии объектов с Викисклада — с лицензией и автором.
//
// Почему скриптом, а не руками: у проекта весь тезис построен на том, что
// каждый факт имеет источник. Картинка — тоже контент, и она тоже должна
// иметь автора и лицензию, иначе на витрине окажется единственный кусок
// данных без происхождения. Скрипт делает это машинально и повторяемо.
//
// Почему файлы кладутся в репозиторий, а не грузятся по ссылке с upload.wikimedia.org:
// демо обязано пережить падение сети в зале. Внешняя картинка в этот момент
// станет белым прямоугольником на первом же экране.
//
// Запуск: node scripts/fetch-photos.mjs            — все объекты
//         node scripts/fetch-photos.mjs chorsu ark — только указанные
// Результат: public/places/<id>.jpg + src/data/photos.ts
//
// Выборочный режим нужен, потому что поиск иногда отдаёт формально верный, но
// негодный для витрины кадр: по запросу «Chorsu Bazaar» первым пришёл мясной
// ряд — объект тот, а первый экран для иностранного туриста таким быть не должен.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/places');
const DATA_FILE = resolve(ROOT, 'src/data/photos.ts');
const CREDITS_FILE = resolve(ROOT, 'scripts/photos.credits.json');
const UA = 'NEXUS30-TravelTech-prototype/1.0 (hackathon; contact via repo)';

// Запрос подобран под каждый объект: у Викисклада поиск по одному слову
// «Ark» вернёт что угодно, кроме бухарской крепости.
const TARGETS = [
  { id: 'registan', query: 'Registan Samarkand square' },
  { id: 'ichan-kala', query: 'Itchan Kala Khiva' },
  { id: 'poi-kalyan', query: 'Kalyan minaret Bukhara' },
  { id: 'gur-emir', query: 'Gur-e-Amir Samarkand' },
  { id: 'shahi-zinda', query: 'Shah-i-Zinda Samarkand' },
  { id: 'khast-imam', query: 'Hazrati Imam complex Tashkent' },
  { id: 'kalta-minor', query: 'Kalta Minor Khiva' },
  { id: 'ark', query: 'Ark of Bukhara fortress' },
  { id: 'ulugbek-observatory', query: 'Ulugh Beg Observatory Samarkand' },
  // Здесь поиск не помогает: по «Chorsu» верхние кадры — мясной ряд внутри.
  // Файл выбран глазами, поэтому закреплён явно.
  { id: 'chorsu', file: 'File:Chorsu Bazaar in Tashkent.jpg' },
];

/** Лицензии, которые можно использовать с указанием автора. Остальные пропускаем. */
const ALLOWED = [/^cc0/i, /^cc by/i, /^public domain/i, /^pd/i];

/** Поле Artist приходит как HTML-фрагмент; нам нужно человекочитаемое имя. */
function stripHtml(value) {
  if (!value) return 'Noma’lum muallif';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

function allowedLicense(name) {
  return Boolean(name) && ALLOWED.some((re) => re.test(name));
}

async function api(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

/** Метаданные приводим к одному виду независимо от того, искали мы файл или закрепили. */
function toRecord(page) {
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const meta = info.extmetadata ?? {};
  return {
    title: page.title,
    thumb: info.thumburl,
    license: meta.LicenseShortName?.value,
    licenseUrl: meta.LicenseUrl?.value ?? 'https://commons.wikimedia.org/wiki/Commons:Licensing',
    author: stripHtml(meta.Artist?.value),
    pageUrl: info.descriptionurl,
  };
}

/**
 * Закреплённый файл: поиск обходится стороной, но лицензия всё равно проверяется —
 * человек выбирает кадр, а не право его использовать.
 */
async function exact(title) {
  const data = await api({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1280',
    format: 'json',
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) throw new Error(`Commons'da topilmadi: ${title}`);
  const record = toRecord(page);
  if (!record) throw new Error(`imageinfo bo'sh: ${title}`);
  if (!allowedLicense(record.license)) throw new Error(`litsenziya mos emas: ${record.license}`);
  return record;
}

/** Ищем кандидатов и берём первого с приемлемой лицензией и достаточным размером. */
async function pick(query) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1280',
    format: 'json',
  });

  const pages = Object.values(data?.query?.pages ?? {});
  // Порядок выдачи поиска = релевантность, поэтому просто идём сверху вниз.
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl) continue;
    // SVG и крошечные файлы на витрине выглядят плохо
    if (!/\.(jpe?g|png)$/i.test(page.title)) continue;
    if ((info.width ?? 0) < 900) continue;

    const record = toRecord(page);
    if (record && allowedLicense(record.license)) return record;
  }
  return null;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`yuklab bo'lmadi: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

/**
 * Атрибуция хранится отдельным JSON и служит источником правды: из него
 * генерируется photos.ts. Без него выборочный перезапуск затирал бы данные
 * всех остальных объектов, потому что в памяти их просто нет.
 */
async function loadCredits() {
  try {
    return JSON.parse(await readFile(CREDITS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const only = process.argv.slice(2);
  const queue = only.length ? TARGETS.filter((t) => only.includes(t.id)) : TARGETS;
  if (only.length && queue.length !== only.length) {
    const known = TARGETS.map((t) => t.id).join(', ');
    throw new Error(`noma'lum id. Mavjudlari: ${known}`);
  }

  const credits = await loadCredits();

  for (const target of queue) {
    process.stdout.write(`${target.id.padEnd(22)} `);
    try {
      const found = target.file ? await exact(target.file) : await pick(target.query);
      if (!found) {
        console.log('топилмади (лицензия мос эмас)');
        continue;
      }
      const file = `${target.id}.jpg`;
      const bytes = await download(found.thumb, resolve(OUT_DIR, file));
      credits[target.id] = { file: `/places/${file}`, ...found };
      console.log(`${found.license.padEnd(14)} ${(bytes / 1024).toFixed(0)}KB`);
    } catch (error) {
      console.log(`ХАТО: ${error.message}`);
    }
  }

  await writeFile(CREDITS_FILE, `${JSON.stringify(credits, null, 2)}\n`);

  // порядок в файле = порядок TARGETS, а не порядок скачивания
  const records = TARGETS.filter((t) => credits[t.id]).map((t) => ({ id: t.id, ...credits[t.id] }));

  const body = records
    .map(
      (r) => `  '${r.id}': {
    src: '${r.file}',
    author: ${JSON.stringify(r.author)},
    license: ${JSON.stringify(r.license)},
    licenseUrl: ${JSON.stringify(r.licenseUrl)},
    sourceUrl: ${JSON.stringify(r.pageUrl)},
  },`,
    )
    .join('\n');

  const file = `// СГЕНЕРИРОВАНО: node scripts/fetch-photos.mjs — руками не править.
//
// Каждая фотография лежит в public/places и несёт автора и лицензию: на витрине
// не должно быть ни одного куска данных без происхождения, включая картинки.
// Атрибуция показывается в интерфейсе (см. PlacePhoto).

export type PhotoCredit = {
  src: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const PHOTOS: Record<string, PhotoCredit> = {
${body}
};

export function photoOf(placeId: string): PhotoCredit | undefined {
  return PHOTOS[placeId];
}
`;

  await writeFile(DATA_FILE, file);
  console.log(`\n${records.length}/${TARGETS.length} расм юкланди -> src/data/photos.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
