import { generateObject } from 'ai';
import { z } from 'zod';
import { CORPUS } from '@/data/corpus';
import { lookupDemoVerdict } from '@/data/demo-cache';
import { hasAI, MODEL } from '@/lib/model';
import { retrieve } from '@/lib/retrieval';
import type { CheckVerdict, Mode } from '@/lib/types';

const verdictSchema = z.object({
  status: z
    .enum(['confirmed', 'refuted', 'unclear'])
    .describe('confirmed — подтверждается источниками, refuted — противоречит им, unclear — в источниках нет ответа'),
  explanation: z.string().describe('2–3 предложения по-русски, со ссылкой на факты из отрывков'),
  correction: z.string().optional().describe('если refuted — как звучит верная формулировка'),
});

export async function POST(req: Request) {
  const { claim } = (await req.json()) as { claim: string };
  if (!claim?.trim()) {
    return Response.json({ error: 'Пустое утверждение' }, { status: 400 });
  }

  const hits = retrieve(CORPUS, claim, 3);
  const sources = [...new Map(hits.map((h) => [h.item.source.url, h.item.source])).values()];
  const passages = hits.map((h) => h.item.text);

  const cached = lookupDemoVerdict(claim);
  const respond = (verdict: CheckVerdict, mode: Mode) =>
    Response.json({ verdict, passages, mode });

  if (!hasAI()) {
    if (cached) return respond(cached, 'offline');
    return respond(
      {
        claim,
        status: 'unclear',
        explanation: hits.length
          ? 'Режим без модели: показываю найденные отрывки из официальных источников — сверьте формулировку сами.'
          : 'В подключённых источниках нет данных по этому утверждению.',
        sources,
      },
      'offline',
    );
  }

  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: verdictSchema,
      abortSignal: AbortSignal.timeout(20_000),
      system:
        'Ты проверяешь утверждения о туристических объектах Узбекистана. ' +
        'Опирайся ТОЛЬКО на приведённые отрывки. Если в них нет ответа — status=unclear, ничего не додумывай. ' +
        'Если утверждение противоречит отрывкам — status=refuted и укажи верную формулировку в correction.',
      prompt: `Утверждение: «${claim}»\n\nОтрывки из официальных источников:\n${
        passages.map((p, i) => `[${i + 1}] ${p}`).join('\n') || '(ничего не найдено)'
      }`,
    });

    return respond({ claim, ...object, sources }, 'ai');
  } catch (error) {
    console.error('[check] LLM недоступен, переключаюсь на офлайн-вердикт:', error);
    if (cached) return respond(cached, 'offline');
    return respond(
      {
        claim,
        status: 'unclear',
        explanation:
          'Модель сейчас недоступна. Ниже — отрывки из официальных источников по вашему запросу.',
        sources,
      },
      'offline',
    );
  }
}
