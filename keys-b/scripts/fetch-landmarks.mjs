// Ichki obidalar (Registon madrasalari) uchun rasmlar — Vikiombordan,
// muallif va litsenziya bilan. Bir martalik: natija landmarks.ts ga yoziladi.
// Ishga tushirish: node scripts/fetch-landmarks.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/photos');
const UA = 'NEXUS30-TravelTech-prototype/1.0 (hackathon)';

// Fayllar qo'lda tanlab biriktirilgan: qidiruv birinchi bo'lib ichki hovli
// yoki detal kadrini berishi mumkin, vitrina uchun old ko'rinish kerak.
const TARGETS = [
  // fayl ko'z bilan tanlangan: qidiruv litografiya va 2KB dagi buzuq faylni berdi
  { id: 'registan-ulugbek', file: 'File:Ulugh Beg Madrasa, Samarkand.jpg' },
  { id: 'registan-sherdor', query: 'Sher-Dor Madrasah Samarkand facade' },
  { id: 'registan-tillakori', file: 'File:Tilya-Kori Madrasah.jpg' },
];

const ALLOWED = [/^cc0/i, /^cc by/i, /^public domain/i, /^pd/i];
const strip = (v) =>
  (v ?? 'Noma’lum')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

async function api(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.json();
}

async function pick(query) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1000',
    format: 'json',
  });
  for (const page of Object.values(data?.query?.pages ?? {})) {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl || !/\.(jpe?g|png)$/i.test(page.title)) continue;
    if ((info.width ?? 0) < 800) continue;
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value;
    if (!license || !ALLOWED.some((re) => re.test(license))) continue;
    return {
      thumb: info.thumburl,
      license,
      author: strip(meta.Artist?.value),
      page: info.descriptionurl,
    };
  }
  return null;
}

/** Aniq fayl: qidiruv chetlab o'tiladi, litsenziya baribir tekshiriladi. */
async function exact(title) {
  const data = await api({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1000',
    format: 'json',
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value;
  if (!license || !ALLOWED.some((re) => re.test(license))) return null;
  return { thumb: info.thumburl, license, author: strip(meta.Artist?.value), page: info.descriptionurl };
}

await mkdir(OUT, { recursive: true });
for (const t of TARGETS) {
  const found = t.file ? await exact(t.file) : await pick(t.query);
  if (!found) {
    console.log(t.id, '— mos litsenziyali rasm topilmadi');
    continue;
  }
  const res = await fetch(found.thumb, { headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(resolve(OUT, `${t.id}.jpg`), buf);
  console.log(
    `${t.id}: ${Math.round(buf.length / 1024)}KB · ${found.license} · ${found.author}`,
  );
  console.log(`  page: ${found.page}`);
}
