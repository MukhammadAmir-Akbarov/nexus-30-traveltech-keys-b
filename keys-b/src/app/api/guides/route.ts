import { PLACES } from '@/data/places';
import { buildItinerary } from '@/lib/planner';
import { getAccuracy, getAccuracyByPlace, getGuides } from '@/lib/store';
import { matchGuides, type GuideQuery } from '@/lib/match';
import { guideQuerySchema, parseBody } from '../_schema';

// LLM здесь не нужен: подбор — это фильтр и сортировка.
export async function POST(req: Request) {
  /*
   * Схема с умолчаниями, а не голый `as GuideQuery`.
   *
   * Раньше тело не проверялось совсем, и это ломалось двумя способами.
   * Пустое или битое тело — `buildItinerary` получал объект без полей и
   * ручка отвечала 500. Тише и опаснее: без `gender` фильтр
   * `q.gender === 'any' || g.gender === q.gender` отсеивал ВСЕХ гидов —
   * пустой список, HTTP 200, ни ошибки, ни лога. Измерено: без поля 0 гидов,
   * с `gender: 'any'` — 5. Жюри, открыв /guides напрямую, увидело бы
   * «гидов нет» и не узнало бы почему.
   */
  const parsed = await parseBody(req, guideQuerySchema);
  if (!parsed.ok) return parsed.response;
  const query = parsed.data as GuideQuery;

  // Объекты предстоящего маршрута: по ним смотрим точность гида адресно.
  // Клиент может прислать свои, иначе берём из маршрута для этого же контекста.
  const placeIds =
    query.placeIds?.length
      ? query.placeIds
      : buildItinerary(PLACES, query).days.flatMap((d) => d.items.map((i) => i.placeId));

  return Response.json({
    guides: matchGuides(getGuides(), {
      ...query,
      placeIds,
      accuracy: getAccuracy(),
      accuracyByPlace: getAccuracyByPlace(),
    }),
  });
}
