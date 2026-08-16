// Sahifadagi har bir CSS/JS asset haqiqatan yuklanadimi — bitta buyruq.
// Ishga tushirish: node scripts/check-assets.mjs [base]
const BASE = process.argv[2] ?? 'http://127.0.0.1:4321';

const html = await (await fetch(BASE + '/')).text();
const assets = [...html.matchAll(/(?:href|src)="(\/_next\/[^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(assets)];

let bad = 0;
for (const path of unique) {
  const res = await fetch(BASE + path);
  const type = res.headers.get('content-type') ?? '?';
  const expectCss = path.endsWith('.css');
  const ok =
    res.status === 200 &&
    (expectCss ? type.includes('text/css') : !type.includes('text/html'));
  if (!ok) {
    bad++;
    console.log('✗', res.status, type.padEnd(24), path);
  }
}
console.log(bad === 0 ? `✓ ${unique.length} asset — hammasi to'g'ri tip bilan 200` : `✗ ${bad}/${unique.length} asset buzuq`);
if (bad) process.exit(1);
