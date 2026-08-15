import { addRequest, findRequestByCode, requestsAllowed } from '@/lib/store';
import type { RequestKind } from '@/lib/types';

const KINDS: RequestKind[] = ['place-problem', 'guide-booking'];

// Заявки от туриста: проблема на объекте и запрос гида.
// Обе падают в один входящий ящик админки — это и есть замыкание сценария:
// приложение не только советует, но и передаёт обратную связь тому, кто решает.
export async function POST(req: Request) {
  const { kind, targetId, message, contact } = (await req.json()) as {
    kind?: RequestKind;
    targetId?: string;
    message?: string;
    contact?: string;
  };

  if (!kind || !KINDS.includes(kind) || !targetId || !message?.trim() || !contact?.trim()) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  // Проверки и вход защищены лимитом, заявки были без него: ящик админки
  // забивался одной командой в цикле.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (!requestsAllowed(ip)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }

  const item = addRequest(kind, targetId, message, contact);
  // Код возвращаем туристу: по нему он потом узнает, что с заявкой стало.
  return Response.json({ id: item.id, code: item.code });
}

/**
 * Статус заявки по коду. Без аккаунта и без персональных данных в ответе:
 * турист видит только то, что и так знает, плюс ответ гида.
 */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') ?? '';
  const item = code.length >= 4 ? findRequestByCode(code) : undefined;
  if (!item) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({
    code: item.code,
    kind: item.kind,
    targetId: item.targetId,
    at: item.at,
    status: item.status ?? 'new',
    reply: item.reply ?? null,
  });
}
