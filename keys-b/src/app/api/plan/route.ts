import { generateObject } from 'ai';
import { z } from 'zod';
import { PLACES, PLACE_BY_ID } from '@/data/places';
import { buildItinerary, selectedRegions } from '@/lib/planner';
import { hasAI, isMockAI, MODEL } from '@/lib/model';
import { allowRequest, ipOf } from '@/lib/store';
import { REGION_LABEL, LANG_LABEL, tr } from '@/lib/i18n';
import { climateNorm, forecastFor, tripDates } from '@/lib/weather';
import type { DayWeather, Itinerary, Lang, Mode, TripContext } from '@/lib/types';
import { parseBody, tripContextSchema } from '../_schema';

const itinerarySchema = z.object({
  summary: z.string().describe('1–2 предложения: чем этот маршрут подходит путешественнику'),
  days: z.array(
    z.object({
      day: z.number().int(),
      title: z.string().describe('короткий заголовок дня'),
      items: z.array(
        z.object({
          placeId: z.string().describe('id объекта строго из предложенного списка'),
          note: z.string().describe('одна фраза: почему объект здесь и на что смотреть'),
        }),
      ),
    }),
  ),
});

/** Оставляем только существующие id и убираем повторы: модель не должна выдумывать объекты. */
function sanitize(raw: Itinerary): Itinerary {
  const seen = new Set<string>();
  const days = raw.days
    .map((day) => ({
      ...day,
      items: day.items.filter((item) => {
        if (!PLACE_BY_ID[item.placeId] || seen.has(item.placeId)) return false;
        seen.add(item.placeId);
        return true;
      }),
    }))
    .filter((day) => day.items.length > 0)
    .map((day, index) => ({ ...day, day: index + 1 }));
  // cost и rules сохраняем: иначе в ветке модели бюджет поездки и объяснение
  // «как собран маршрут» молча исчезали бы — а это главный тезис продукта
  return { summary: raw.summary, days, cost: raw.cost, rules: raw.rules };
}

/** Маршрутов с одного адреса в минуту: каждый — запрос к модели и к погоде. */
const PLANS_PER_MINUTE = 30;

/**
 * Погода запрашивается по тому городу, где турист окажется в этот день, а не по
 * одному городу на всю поездку. Поэтому два прохода: сначала черновик маршрута,
 * потом прогноз по его городам, потом пересборка уже с погодой.
 */
async function weatherForDraft(ctx: TripContext, lang: Lang): Promise<DayWeather[]> {
  const draft = buildItinerary(PLACES, { ...ctx, lang });
  const dates = tripDates(draft.days.length, ctx.startDate);

  const regionOfDay = draft.days.map(
    (day) => PLACE_BY_ID[day.items[0]?.placeId]?.region ?? 'tashkent',
  );

  // города спрашиваем параллельно: последовательно турист ждал бы секунды впустую
  const unique = [...new Set(regionOfDay)];
  const byRegion = new Map(
    await Promise.all(
      unique.map(async (region) => {
        const days = dates.filter((_, i) => regionOfDay[i] === region);
        return [region, await forecastFor(region, days)] as const;
      }),
    ),
  );

  const cursor = new Map<string, number>();
  return regionOfDay.map((region) => {
    const index = cursor.get(region) ?? 0;
    cursor.set(region, index + 1);
    return byRegion.get(region)?.[index] ?? climateNorm(region, dates[index] ?? dates[0]);
  });
}

export async function POST(req: Request) {
  // Ограничение частоты стоит ПЕРЕД разбором тела: это самая дешёвая проверка,
  // и на неё не нужно ни читать поток, ни валидировать схему.
  if (!allowRequest('plan', ipOf(req), PLANS_PER_MINUTE, 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }

  /*
   * Схема пропускает незнакомые поля насквозь (`looseObject`) — весь ctx
   * уходит в `buildItinerary`, и выброшенное здесь поле молча выключило бы
   * чужую логику. Так, `startRegion` (город старта) появился недавно:
   * строгая схема убрала бы его, маршрут снова начинался бы из Ташкента,
   * и найти причину по симптому было бы почти невозможно.
   */
  const parsed = await parseBody(req, tripContextSchema);
  if (!parsed.ok) return parsed.response;
  const ctx = parsed.data as TripContext;
  const lang = ctx.lang ?? 'ru';

  const weather = await weatherForDraft(ctx, lang);

  const offline = (): Response =>
    Response.json({
      itinerary: buildItinerary(PLACES, { ...ctx, lang }, weather),
      mode: 'offline' satisfies Mode,
    });

  if (!hasAI()) return offline();

  // Репетиция ветки модели без ключа: ответ подставляем, а дальше он проходит
  // ровно тот же путь — санитайзинг id, сборка ответа, метка «составлено моделью».
  if (isMockAI()) {
    const draft = buildItinerary(PLACES, { ...ctx, lang }, weather);
    return Response.json({
      itinerary: sanitize({
        summary: `[MOCK] ${draft.summary}`,
        days: draft.days,
        cost: draft.cost,
      }),
      mode: 'ai' satisfies Mode,
    });
  }

  /*
   * Отбор кандидатов должен совпадать с тем, что делает планировщик без
   * модели, иначе две ветки одного экрана отвечают по-разному.
   *
   * Здесь стояло `ctx.region === 'all' || p.region === ctx.region` — только
   * одно поле. Турист, выбравший два города, с ключом получал объекты
   * одного: `ctx.regions` до модели не доходил. И объекты, убранные руками
   * (`ctx.excluded`), возвращались обратно — правка маршрута работала без
   * ключа и молча переставала работать с ключом.
   *
   * `selectedRegions()` уже экспортирован из planner.ts и знает оба поля:
   * повторять его логику здесь значило бы завести третье место, где живёт
   * один и тот же вопрос «какие регионы выбраны».
   */
  const regions = selectedRegions(ctx);
  const excluded = new Set(ctx.excluded ?? []);
  const candidates = PLACES.filter(
    (p) => (regions.length === 0 || regions.includes(p.region)) && !excluded.has(p.id),
  ).map(
    (p) => ({
      id: p.id,
      name: tr(p.name, lang),
      region: tr(REGION_LABEL[p.region], lang),
      interests: p.interests.join(', '),
      minutes: p.visitMinutes,
      familyFriendly: p.familyFriendly,
      summary: tr(p.summary, lang),
    }),
  );

  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: itinerarySchema,
      abortSignal: AbortSignal.timeout(20_000),
      system:
        'Ты планировщик путешествий по Узбекистану. Составляй маршрут ТОЛЬКО из предложенных объектов, ' +
        'используй их id без изменений. Учитывай формат поездки, интересы и время осмотра: ' +
        'не более ~5,5 часов осмотра в день. Объекты одного дня должны быть в одном городе. ' +
        'Для формата family не предлагай объекты с familyFriendly=false. ' +
        'Если указан город, где турист уже находится, первый день начинается в нём. ' +
        `Весь текст ответа (summary, title, note) пиши на языке: ${LANG_LABEL[lang]}.`,
      prompt:
        `Формат поездки: ${ctx.travelType}. Дней: ${ctx.days}. ` +
        `Интересы: ${ctx.interests.join(', ') || 'не указаны'}. ` +
        `Регион: ${ctx.region === 'all' ? 'любой' : tr(REGION_LABEL[ctx.region], lang)}. ` +
        // Город старта доезжал до buildItinerary, но не до модели: без ключа
        // маршрут начинался откуда просил турист, а с ключом — откуда решит
        // модель, и причина такого расхождения на демо была бы не видна.
        (ctx.startRegion
          ? `Турист уже находится в городе: ${tr(REGION_LABEL[ctx.startRegion], lang)}, ` +
            'первый день обязан проходить именно там.'
          : '') +
        `\n\nДоступные объекты:\n${JSON.stringify(candidates, null, 1)}`,
    });

    const itinerary = sanitize(object as Itinerary);
    if (itinerary.days.length === 0) return offline();
    return Response.json({ itinerary, mode: 'ai' satisfies Mode });
  } catch (error) {
    console.error('[plan] LLM недоступен, отдаю правило-основанный маршрут:', error);
    return offline();
  }
}
