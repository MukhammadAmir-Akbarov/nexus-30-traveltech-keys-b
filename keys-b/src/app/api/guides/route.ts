import { PLACES } from '@/data/places';
import { buildItinerary } from '@/lib/planner';
import { getAccuracy, getAccuracyByPlace, getGuides } from '@/lib/store';
import { matchGuides, type GuideQuery } from '@/lib/match';

// LLM здесь не нужен: подбор — это фильтр и сортировка.
export async function POST(req: Request) {
  const query = (await req.json()) as GuideQuery;

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
