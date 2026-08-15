import { currentSession } from '@/lib/session';
import { answerRequest } from '@/lib/store';

// Гид отвечает на заявку туриста: «беру» или «занят».
// Круг замыкается здесь: раньше заявка падала в общий ящик и умирала.
export async function POST(req: Request) {
  const session = await currentSession();
  if (session?.role !== 'guide' || !session.guideId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const { requestId, status, note } = (await req.json()) as {
    requestId?: string;
    status?: 'taken' | 'busy';
    note?: string;
  };
  if (!requestId || (status !== 'taken' && status !== 'busy')) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  // Чужую заявку не тронуть: проверка привязки — внутри answerRequest.
  const ok = answerRequest(requestId, session.guideId, status, note);
  return ok ? Response.json({ ok: true }) : Response.json({ error: 'not_found' }, { status: 404 });
}
