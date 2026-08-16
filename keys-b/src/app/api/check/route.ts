import { generateObject } from 'ai';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { imageCheckSchema, readJson } from '../_schema';
import { identifyImage } from '@/lib/vision';
import { briefingFor } from '@/lib/briefing';
import {
  allowRequest,
  getCorpus,
  ipOf,
  noteClaimSource,
  noteGap,
  recordFactCheck,
} from '@/lib/store';
import { lookupDemoVerdict } from '@/data/demo-cache';
import { disputedForLang, findDisputed } from '@/lib/disputed';
import { hasAI, isMockAI, MODEL } from '@/lib/model';
import { LANG_LABEL, t, tr } from '@/lib/i18n';
import { retrieve } from '@/lib/retrieval';
import { ruleVerdict, toRoman, type RuleVerdict } from '@/lib/verdict';
import type { CheckVerdict, ClaimSource, I18nText, Lang, Mode } from '@/lib/types';

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

/**
 * Правило сработало — превращаем его в вердикт на языке интерфейса.
 *
 * Объяснение собирается из чисел, а не из текста источника: отрывки у нас
 * канонически по-русски, и подставлять их в узбекский интерфейс как объяснение
 * значит отвечать не на том языке, на котором спросили. Сам отрывок при этом
 * никуда не девается — он приходит в passages и показан рядом.
 */
function fromRule(
  ruled: RuleVerdict,
  claim: string,
  lang: Lang,
  sources: CheckVerdict['sources'],
): CheckVerdict {
  const format = (value: number) => (ruled.kind === 'century' ? toRoman(value) : String(value));
  const first = ruled.sourceValues[0];
  const last = ruled.sourceValues[ruled.sourceValues.length - 1];
  const sourceText = first === last ? format(first) : `${format(first)}–${format(last)}`;

  return {
    claim,
    status: 'refuted',
    explanation:
      `${t(ruled.kind === 'century' ? 'ruleRefutedCentury' : 'ruleRefutedYear', lang)} ` +
      `${t('ruleClaimLabel', lang)}: ${format(ruled.claimValue)}; ` +
      `${t('ruleSourceLabel', lang)}: ${sourceText}. ${t('ruleModeNote', lang)}`,
    correction: ruled.passage,
    sources,
  };
}

const CLIENT_COOKIE = 'nexus30_client';

/** Идентификатор устройства для защиты от накрутки. Личность не нужна, нужна повторяемость. */
function clientIdFrom(req: Request): { id: string; isNew: boolean } {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${CLIENT_COOKIE}=([^;]+)`));
  return match ? { id: match[1], isNew: false } : { id: randomUUID(), isNew: true };
}

/** Проверок с одного адреса в минуту. Человек столько не набирает, скрипт — легко. */
const CHECKS_PER_MINUTE = 40;

export async function POST(req: Request) {
  // Разбор отдельно от проверки полей: проверка ниже написана и работает,
  // переписывать её накануне защиты — лишний риск. Битое тело до неё
  // не доходило и уходило пятисоткой.
  const body = await readJson(req);
  if (!body.ok) return body.response;

  /*
   * Фотография — третий вход в эту же ручку, рядом с текстом и голосом.
   * Ветка стоит здесь, ДО требования непустого claim: у снимка своего
   * утверждения нет, турист просто показывает, что перед ним.
   *
   * Если поля image нет, ничего не меняется — текстовый поток идёт дальше
   * тем же путём, что и до этой правки.
   */
  if ((body.data as { image?: unknown }).image !== undefined) {
    const parsed = imageCheckSchema.safeParse(body.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return Response.json(
        { error: 'bad_image', field: first?.path.join('.') || undefined, detail: first?.message },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(Buffer.from(parsed.data.image, 'base64'));
    // base64 «разбирается» почти всегда, поэтому смотрим на результат:
    // пустой массив значит, что прислали не изображение, а мусор.
    if (bytes.length === 0) {
      return Response.json({ error: 'bad_image' }, { status: 400 });
    }

    const match = await identifyImage(bytes, parsed.data.mime, parsed.data.lang);

    // «Не узнал» — такой же честный ответ, как unclear у вердикта и null
    // у nearestPlace. Пустая карточка вместо ответа была бы хуже: человек
    // не поймёт, сломалось приложение или снимка нет в базе.
    if (!match) return Response.json({ unknown: true });

    return Response.json({
      place: { id: match.place.id, name: match.place.name, region: match.place.region },
      mode: match.mode,
      confidence: match.confidence,
      briefing: briefingFor(match.place.id, parsed.data.lang),
    });
  }

  /*
   * guideId и placeId читаются здесь и дальше идут в recordFactCheck —
   * это и есть связка «проверка факта → репутация гида», ради которой
   * весь продукт и строится. Схему для этой ручки писать не стали именно
   * поэтому: любой недосмотр в списке полей тихо разорвал бы эту цепочку.
   */
  const { claim, lang = 'ru', guideId, placeId, source } = body.data as {
    claim: string;
    lang?: Lang;
    guideId?: string;
    placeId?: string;
    source?: ClaimSource;
  };
  if (!claim?.trim()) {
    return Response.json({ error: 'Пустое утверждение' }, { status: 400 });
  }
  // Репутация гида защищена лимитом по устройству, а сам запрос к модели — нет:
  // ключ платный, и цикл из чужого скрипта тратит деньги заказчика.
  if (!allowRequest('check', ipOf(req), CHECKS_PER_MINUTE, 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const client = clientIdFrom(req);

  const hits = retrieve(getCorpus(), claim, 3);
  const sources = [
    ...new Map(
      hits.map((h) => [
        h.item.source.url,
        {
          title: tr(h.item.source.title, lang),
          url: h.item.source.url,
          tier: h.item.source.tier ?? 'secondary',
        },
      ]),
    ).values(),
  ]
    // официальные источники показываем первыми: вес у них разный
    .sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'official' ? -1 : 1));
  const passages = hits.map((h) => h.item.text);

  // Спорные темы проверяем ДО модели и до кэша: если источники расходятся,
  // выдавать одну сторону за истину нельзя — это ровно то, в чём мы упрекаем
  // недобросовестного гида.
  const topic = findDisputed(claim);
  const disputed = topic ? disputedForLang(topic, lang) : undefined;

  const cached = lookupDemoVerdict(claim, lang);
  const respond = (verdict: CheckVerdict, mode: Mode) => {
    /*
     * «Нет ответа в источниках» — не пустой результат, а сигнал заказчику:
     * по этой теме у государства нет опубликованного ответа. Складываем такие
     * вопросы в журнал, а отчёт Комитету сортирует их по частоте. Спорные темы
     * сюда не идут: там ответ есть, просто источники не сошлись.
     */
    if (verdict.status === 'unclear' && !disputed) noteGap(claim, placeId);

    /*
     * Откуда человек это услышал. Гид — не единственный источник ошибок и чаще
     * всего не главный: люди читают табличку у входа и первую ссылку в поиске.
     * Разделив источники, Комитет получает не «кто-то ошибается», а «на этом
     * объекте табличка вводит в заблуждение» — то есть поручение подрядчику.
     */
    if (source) noteClaimSource(source, verdict.status);

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
    // Раньше здесь стояло `hits.length ? 'confirmed' : 'unclear'`: любое
    // утверждение, к которому нашёлся отрывок, объявлялось подтверждённым —
    // включая заведомо ложное. Подтверждать по факту совпадения слов нельзя.
    const ruled = ruleVerdict(claim, passages);
    const base: CheckVerdict = ruled
      ? fromRule(ruled, claim, lang, sources)
      : {
          claim,
          status: 'unclear',
          explanation: hits[0]?.item.text ?? OFFLINE_TEXT.noHits[lang],
          sources,
        };
    return respond({ ...base, explanation: `[MOCK] ${base.explanation}` }, 'ai');
  }

  if (!hasAI()) {
    if (cached) return respond(cached, 'offline');

    // Без ключа мы всё равно умеем ловить перепутанный век и год — это
    // арифметика по отрывку, а не суждение модели. Раньше на любой вопрос
    // вне демо-кэша здесь возвращалось «unclear: сверьте формулировку сами»,
    // то есть главная функция продукта визуально ничего не делала.
    const ruled = ruleVerdict(claim, passages);
    if (ruled) return respond(fromRule(ruled, claim, lang, sources), 'offline');

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
