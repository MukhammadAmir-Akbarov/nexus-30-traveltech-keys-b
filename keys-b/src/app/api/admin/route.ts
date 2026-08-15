import { randomBytes } from 'node:crypto';
import { currentSession } from '@/lib/session';
import {
  addCorpusItem,
  createGuideAccount,
  getCorpus,
  getGuides,
  markRequestDone,
  removeCorpusItem,
  removeGuide,
  resolveDispute,
  toggleGuideVerified,
} from '@/lib/store';
import type { CorpusItem } from '@/lib/types';

// Все действия админки идут через один роут: проверка прав в одном месте,
// а не в пяти обработчиках.

type Action =
  | { type: 'toggleGuide'; id: string }
  | { type: 'removeGuide'; id: string }
  | { type: 'addFact'; text: string; placeId?: string; sourceTitle: string; sourceUrl: string }
  | { type: 'removeFact'; id: string }
  | { type: 'guideAccount'; id: string }
  | { type: 'resolve-dispute'; id: string; outcome: 'upheld' | 'rejected' }
  | { type: 'request-done'; id: string }
  | { type: 'export' };

/**
 * Пароль для доступа гида: показывается администратору один раз.
 *
 * randomBytes, а не Math.random: это настоящий пароль от чужого кабинета.
 * Math.random не криптографический — его поток предсказуем по нескольким
 * выданным значениям, а выдаёт их та же самая ручка администратора.
 */
function tempPassword(): string {
  return randomBytes(9).toString('base64url');
}

/** Ручной разбор возражения гида: значение приходит из тела запроса, поэтому проверяем. */
const DISPUTE_OUTCOMES = ['upheld', 'rejected'] as const;

function isDisputeOutcome(value: unknown): value is (typeof DISPUTE_OUTCOMES)[number] {
  return DISPUTE_OUTCOMES.includes(value as (typeof DISPUTE_OUTCOMES)[number]);
}

export async function POST(req: Request) {
  const session = await currentSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const action = (await req.json()) as Action;

  switch (action.type) {
    case 'toggleGuide': {
      const guide = toggleGuideVerified(action.id);
      return guide
        ? Response.json({ ok: true, verified: guide.verified })
        : Response.json({ error: 'not_found' }, { status: 404 });
    }
    case 'removeGuide':
      return Response.json({ ok: removeGuide(action.id) });

    case 'addFact': {
      if (!action.text?.trim() || !action.sourceUrl?.trim()) {
        return Response.json({ error: 'missing_fields' }, { status: 400 });
      }
      const title = action.sourceTitle?.trim() || action.sourceUrl;
      const item: CorpusItem = {
        id: `admin-${getCorpus().length + 1}-${Math.round(performance.now())}`,
        placeId: action.placeId || undefined,
        text: action.text.trim(),
        // ключевые слова берём из самого текста: отдельного поля админу заполнять не нужно
        keywords: action.text.toLowerCase().split(/[^a-zа-я0-9]+/i).filter((w) => w.length > 3),
        source: { title: { uz: title, ru: title, en: title }, url: action.sourceUrl.trim() },
      };
      addCorpusItem(item);
      return Response.json({ ok: true, id: item.id });
    }
    case 'removeFact':
      return Response.json({ ok: removeCorpusItem(action.id) });

    case 'guideAccount': {
      const password = tempPassword();
      const user = createGuideAccount(action.id, password);
      return user
        ? Response.json({ ok: true, email: user.email, password })
        : Response.json({ error: 'exists_or_not_found' }, { status: 409 });
    }

    case 'resolve-dispute': {
      if (!isDisputeOutcome(action.outcome)) {
        return Response.json({ error: 'bad_outcome' }, { status: 400 });
      }
      return Response.json({ ok: resolveDispute(action.id, action.outcome) });
    }

    case 'request-done':
      return Response.json({ ok: markRequestDone(action.id) });

    case 'export':
      return Response.json({ guides: getGuides(), corpus: getCorpus() });

    default:
      return Response.json({ error: 'unknown_action' }, { status: 400 });
  }
}
