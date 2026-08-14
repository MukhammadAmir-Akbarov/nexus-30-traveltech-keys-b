import { generateObject } from 'ai';
import { z } from 'zod';
import { PLACES, PLACE_BY_ID, REGION_LABEL } from '@/data/places';
import { buildItinerary } from '@/lib/planner';
import { hasAI, MODEL } from '@/lib/model';
import type { Itinerary, Mode, TripContext } from '@/lib/types';

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
  return { summary: raw.summary, days };
}

export async function POST(req: Request) {
  const ctx = (await req.json()) as TripContext;
  const offline = (): Response =>
    Response.json({ itinerary: buildItinerary(PLACES, ctx), mode: 'offline' satisfies Mode });

  if (!hasAI()) return offline();

  const candidates = PLACES.filter((p) => ctx.region === 'all' || p.region === ctx.region).map(
    (p) => ({
      id: p.id,
      name: p.name,
      region: REGION_LABEL[p.region],
      interests: p.interests.join(', '),
      minutes: p.visitMinutes,
      familyFriendly: p.familyFriendly,
      summary: p.summary,
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
        'Для формата family не предлагай объекты с familyFriendly=false. Отвечай по-русски.',
      prompt:
        `Формат поездки: ${ctx.travelType}. Дней: ${ctx.days}. ` +
        `Интересы: ${ctx.interests.join(', ') || 'не указаны'}. ` +
        `Регион: ${ctx.region === 'all' ? 'любой' : REGION_LABEL[ctx.region]}.\n\n` +
        `Доступные объекты:\n${JSON.stringify(candidates, null, 1)}`,
    });

    const itinerary = sanitize(object as Itinerary);
    if (itinerary.days.length === 0) return offline();
    return Response.json({ itinerary, mode: 'ai' satisfies Mode });
  } catch (error) {
    console.error('[plan] LLM недоступен, отдаю правило-основанный маршрут:', error);
    return offline();
  }
}
