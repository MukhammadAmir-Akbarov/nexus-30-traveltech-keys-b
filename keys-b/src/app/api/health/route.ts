import { CORPUS } from '@/data/corpus';
import { PLACES } from '@/data/places';
import { danglingRefs } from '@/lib/db';
import { getGuides } from '@/lib/store';
import { hasAI } from '@/lib/model';

// Состояние приложения одним запросом.
//
// Площадка (Render) и внешний монитор должны уметь спросить «ты живой?» без
// разбора HTML главной страницы, а на показе полезно за две секунды ответить
// «сколько объектов в базе и связна ли она». Ответ намеренно скупой: ни одного
// поля, которого нет на видимых страницах, — иначе это станет утечкой.

export const dynamic = 'force-dynamic';

export async function GET() {
  const problems = danglingRefs();
  return Response.json(
    {
      ok: problems.length === 0,
      places: PLACES.length,
      corpus: CORPUS.length,
      guides: getGuides().length,
      // режим ответа честно назван и здесь, как и в интерфейсе
      mode: hasAI() ? 'ai' : 'offline',
      dangling: problems.length,
      uptimeSeconds: Math.round(process.uptime()),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
