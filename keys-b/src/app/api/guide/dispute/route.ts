import { currentSession } from '@/lib/session';
import { disputeVerdict } from '@/lib/store';
import { readJson } from '../../_schema';

// Гид оспаривает вердикт. Счётчики не меняем: решение принимает Комитет,
// иначе оспаривание превратилось бы в кнопку «стереть плохую оценку».
export async function POST(req: Request) {
  const session = await currentSession();
  if (session?.role !== 'guide' || !session.guideId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  // Порядок сохранён: сначала сессия, потом тело. Чужой запрос отсекается
  // раньше, чем мы вообще смотрим, что в нём прислали.
  const body = await readJson(req);
  if (!body.ok) return body.response;

  const { verdictId, note } = body.data as { verdictId?: string; note?: string };
  if (!verdictId || !note || note.trim().length < 5) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  // guideId берём из сессии, а не из тела: чужой вердикт оспорить нельзя
  const ok = disputeVerdict(verdictId, session.guideId, note);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: 'not_found' }, { status: 404 });
}
