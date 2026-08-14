import type { Itinerary, ItineraryDay, Place, TripContext } from './types.ts';

// Правило-основанный планировщик. Работает без сети — это одновременно
// и запасной путь, если LLM недоступен на демо.

const MINUTES_PER_DAY = 330; // ~5.5 часов осмотра, остальное — дорога и еда

function haversineKm(a: Place, b: Place): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function scorePlace(place: Place, ctx: TripContext): number {
  let score = place.interests.filter((i) => ctx.interests.includes(i)).length * 2;
  if (ctx.region !== 'all' && place.region === ctx.region) score += 3;
  if (ctx.travelType === 'family' && place.familyFriendly) score += 1;
  if (ctx.travelType === 'group' && place.visitMinutes <= 60) score += 0.5;
  if (ctx.travelType === 'solo' && place.interests.includes('photo')) score += 0.5;
  return score;
}

/** Сортировка внутри дня: ближайший сосед от самого важного объекта. */
function orderByProximity(places: Place[]): Place[] {
  if (places.length <= 2) return places;
  const rest = places.slice(1);
  const ordered = [places[0]];
  while (rest.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (haversineKm(last, rest[i]) < haversineKm(last, rest[best])) best = i;
    }
    ordered.push(rest.splice(best, 1)[0]);
  }
  return ordered;
}

function noteFor(place: Place, ctx: TripContext): string {
  const shared = place.interests.filter((i) => ctx.interests.includes(i));
  if (ctx.travelType === 'family' && place.familyFriendly) {
    return `${place.summary} Подходит для поездки с детьми.`;
  }
  if (shared.length) return `${place.summary} Совпадает с вашими интересами.`;
  return place.summary;
}

export function buildItinerary(places: Place[], ctx: TripContext): Itinerary {
  const pool = places
    .filter((p) => ctx.region === 'all' || p.region === ctx.region)
    // формат «семья» — объекты без familyFriendly не предлагаем вовсе
    .filter((p) => ctx.travelType !== 'family' || p.familyFriendly)
    .map((p) => ({ place: p, score: scorePlace(p, ctx) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.place.visitMinutes - b.place.visitMinutes)
    .map((p) => p.place);

  const days: ItineraryDay[] = [];
  let queue = [...pool];

  for (let day = 1; day <= ctx.days && queue.length; day++) {
    const region = queue[0].region;
    const sameRegion = queue.filter((p) => p.region === region);
    const picked: Place[] = [];
    let minutes = 0;
    // равномерно размазываем объекты по оставшимся дням, иначе первый день забит,
    // а последний пустой
    const cap = Math.max(1, Math.ceil(queue.length / (ctx.days - day + 1)));

    for (const place of sameRegion) {
      if (picked.length >= cap) break;
      if (minutes + place.visitMinutes > MINUTES_PER_DAY) continue;
      picked.push(place);
      minutes += place.visitMinutes;
    }
    if (picked.length === 0) picked.push(sameRegion[0] ?? queue[0]);

    queue = queue.filter((p) => !picked.includes(p));
    const ordered = orderByProximity(picked);

    days.push({
      day,
      title:
        ordered.length > 1
          ? `${ordered[0].name} + ещё ${ordered.length - 1}`
          : ordered[0].name,
      items: ordered.map((p) => ({ placeId: p.id, note: noteFor(p, ctx) })),
    });
  }

  const total = days.reduce((sum, d) => sum + d.items.length, 0);
  return {
    summary:
      days.length === 0
        ? 'Под выбранные фильтры объектов не нашлось — снимите часть интересов.'
        : `Маршрут на ${days.length} дн.: ${total} объектов, подобранных под формат «${ctx.travelType}» и ваши интересы.`,
    days,
  };
}
