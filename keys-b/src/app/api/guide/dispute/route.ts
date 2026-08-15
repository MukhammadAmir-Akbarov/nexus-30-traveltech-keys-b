import { currentSession } from '@/lib/session';
import { disputeVerdict } from '@/lib/store';

// Гид оспаривает вердикт. Счётчики не меняем: решение принимает Комитет,
// иначе оспаривание превратилось бы в кнопку «стереть плохую оценку».
export async function POST(req: Request) {
  const session = await currentSession();
  if (session?.role !== 'guide' || !session.guideId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { verdictId, note } = (await req.json()) as { verdictId?: string; note?: string };
  if (!verdictId || !note || note.trim().length < 5) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  // guideId берём из сессии, а не из тела: чужой вердикт оспорить нельзя
  const ok = disputeVerdict(verdictId, session.guideId, note);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: 'not_found' }, { status: 404 });
}
