// Soatlik prod salomatlik tekshiruvi (§55 naqshi). Vaqtincha emas — qayta ishlatiladi.
// Ishga tushirish: node scripts/prod-health.mjs [base]
const BASE = process.argv[2] ?? 'https://turizm-hamroh.onrender.com';

const out = [];
async function check(name, fn) {
  try {
    out.push([name, await fn()]);
  } catch (e) {
    out.push([name, 'XATO: ' + e.message.slice(0, 50)]);
  }
}

const post = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

await check('uz «XII asr»', async () => {
  const d = await post('/api/check', { claim: 'Registon XII asrda qurilgan', lang: 'uz' });
  return d.verdict.status;
});
await check('ru «XII веке»', async () => {
  const d = await post('/api/check', { claim: 'Регистан построен в XII веке', lang: 'ru' });
  return d.verdict.status;
});
await check('halqa (guideId)', async () => {
  const d = await post('/api/check', {
    claim: 'Registon XII asrda qurilgan',
    lang: 'uz',
    guideId: 'g1',
    placeId: 'registan',
  });
  return d.verdict.status + ' / counted: ' + d.counted;
});
await check('/nearby', async () => (await fetch(BASE + '/nearby')).status);
await check('/ (bosh)', async () => (await fetch(BASE + '/')).status);

for (const [k, v] of out) console.log(String(k).padEnd(18), '→', v);
