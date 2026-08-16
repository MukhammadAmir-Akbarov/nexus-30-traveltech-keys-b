// Commons nomzodlarini ro'yxatlash: node scripts/list-commons.mjs "qidiruv"
const q = process.argv[2];
const url = new URL('https://commons.wikimedia.org/w/api.php');
url.searchParams.set('action', 'query');
url.searchParams.set('generator', 'search');
url.searchParams.set('gsrsearch', q);
url.searchParams.set('gsrnamespace', '6');
url.searchParams.set('gsrlimit', '10');
url.searchParams.set('prop', 'imageinfo');
url.searchParams.set('iiprop', 'url|extmetadata|size');
url.searchParams.set('format', 'json');
const d = await (await fetch(url, { headers: { 'User-Agent': 'NEXUS30/1.0' } })).json();
for (const p of Object.values(d?.query?.pages ?? {})) {
  const ii = p?.imageinfo?.[0] ?? {};
  const lic = ii.extmetadata?.LicenseShortName?.value ?? '?';
  console.log(lic.padEnd(16), String(ii.width).padEnd(6), p.title?.slice(0, 75));
}
