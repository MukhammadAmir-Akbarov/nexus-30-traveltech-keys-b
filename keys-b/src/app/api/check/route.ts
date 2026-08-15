import { generateObject } from 'ai';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCorpus, recordFactCheck } from '@/lib/store';
import { lookupDemoVerdict } from '@/data/demo-cache';
import { disputedForLang, findDisputed } from '@/lib/disputed';
import { hasAI, isMockAI, MODEL } from '@/lib/model';
import { LANG_LABEL, tr } from '@/lib/i18n';
import { retrieve } from '@/lib/retrieval';
import type { CheckVerdict, I18nText, Lang, Mode } from '@/lib/types';

const verdictSchema = z.object({
  status: z
    .enum(['confirmed', 'refuted', 'unclear'])
    .describe('confirmed — подтверждается источниками, refuted — противоречит им, unclear — в источниках нет ответа'),
  explanation: z.string().describe('2–3 предложения со ссылкой на факты из отрывков'),
  correction: z.string().optional().describe('если refuted — как звучит верная формулировка'),
});

const OFFLINE_TEXT = {
  withHits: {
    uz: 'Modelsiz rejim: rasmiy manbalardan topilgan parchalar quyida — ifodani o‘zingiz solishtiring.',
    ru: 'Режим без модели: показываю найденные отрывки из официальных источников — сверьте формулировку сами.',
    en: 'Model-free mode: here are the matching passages from the official sources — compare the wording yourself.',
  },
  noHits: {
    uz: 'Ulangan manbalarda bu bo‘yicha ma’lumot yo‘q.',
    ru: 'В подключённых источниках нет данных по этому утверждению.',
    en: 'The connected sources hold no data on this claim.',
  },
  llmDown: {
    uz: 'Model hozir mavjud emas. Quyida so‘rovingiz bo‘yicha rasmiy manbalardan parchalar.',
    ru: 'Модель сейчас недоступна. Ниже — отрывки из официальных источников по вашему запросу.',
    en: 'The model is unavailable right now. Below are passages from the official sources for your query.',
  },
} satisfies Record<string, I18nText>;

const CLIENT_COOKIE = 'nexus30_client';

/** Идентификатор устройства для защиты от накрутки. Личность не нужна, нужна повторяемость. */
function clientIdFrom(req: Request): { id: string; isNew: boolean } {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${CLIENT_COOKIE}=([^;]+)`));
  return match ? { id: match[1], isNew: false } : { id: randomUUID(), isNew: true };
}

export async function POST(req: Request) {
  const { claim, lang = 'ru', guideId, placeId } = (await req.json()) as {
    claim: string;
    lang?: Lang;
    guideId?: string;
    placeId?: string;
  };
  if (!claim?.trim()) {
    return Response.json({ error: 'Пустое утверждение' }, { status: 400 });
  }
  const client = clientIdFrom(req);

  const hits = retrieve(getCorpus(), claim, 3);
  const sources = [
    ...new Map(
      hits.map((h) => [h.item.source.url, { title: tr(h.item.source.title, lang), url: h.item.source.url }]),
    ).values(),
  ];
  const passages = hits.map((h) => h.item.text);

  // Спорные темы проверяем ДО модели и до кэша: если источники расходятся,
  // выдавать одну сторону за истину нельзя — это ровно то, в чём мы упрекаем
  // недобросовестного гида.
  const topic = findDisputed(claim);
  const disputed = topic ? disputedForLang(topic, lang) : undefined;

  const cached = lookupDemoVerdict(claim, lang);
  const respond = (verdict: CheckVerdict, mode: Mode) => {
    // если турист указал, чьи слова проверяет, вердикт идёт в репутацию гида —
    // но только если это не повтор того же утверждения и не поток от скрипта
    // спорную тему в репутацию не пишем: гид не виноват, что источники не сошлись
    const counted =
      guideId && !disputed
        ? recordFactCheck(guideId, verdict.status, placeId, client.id, claim)
        : undefined;
    const res = Response.json({ verdict, passages, mode, counted, disputed });
    if (client.isNew) {
      res.headers.append(
        'Set-Cookie',
        `${CLIENT_COOKIE}=${client.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      );
    }
    return res;
  };

  if (disputed) {
    return respond(
      {
        claim,
        status: 'unclear',
        explanation: disputed.note,
        sources: disputed.positions.map((p) => ({ title: p.title, url: p.url })),
      },
      'offline',
    );
  }

  // Репетиция ветки модели без ключа: путь тот же, метка та же, ответ подставлен.
  if (isMockAI()) {
    if (cached) return respond({ ...cached, explanation: `[MOCK] ${cached.explanation}` }, 'ai');
    return respond(
      {
        claim,
        status: hits.length ? 'confirmed' : 'unclear',
        explanation: `[MOCK] ${hits[0]?.item.text ?? OFFLINE_TEXT.noHits[lang]}`,
        sources,
      },
      'ai',
    );
  }

  if (!hasAI()) {
    if (cached) return respond(cached, 'offline');
    return respond(
      {
        claim,
        status: 'unclear',
        explanation: hits.length ? OFFLINE_TEXT.withHits[lang] : OFFLINE_TEXT.noHits[lang],
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
        'Если утверждение противоречит отрывкам — status=refuted и укажи верную формулировку в correction. ' +
        `Отрывки даны по-русски, но explanation и correction пиши на языке: ${LANG_LABEL[lang]}.`,
      prompt: `Утверждение: «${claim}»\n\nОтрывки из официальных источников:\n${
        passages.map((p, i) => `[${i + 1}] ${p}`).join('\n') || '(ничего не найдено)'
      }`,
    });

    return respond({ claim, ...object, sources }, 'ai');
  } catch (error) {
    console.error('[check] LLM недоступен, переключаюсь на офлайн-вердикт:', error);
    if (cached) return respond(cached, 'offline');
    return respond(
      { claim, status: 'unclear', explanation: OFFLINE_TEXT.llmDown[lang], sources },
      'offline',
    );
  }
}
