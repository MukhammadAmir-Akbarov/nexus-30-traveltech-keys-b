import { addRequest } from '@/lib/store';
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

  const item = addRequest(kind, targetId, message, contact);
  return Response.json({ id: item.id });
}
