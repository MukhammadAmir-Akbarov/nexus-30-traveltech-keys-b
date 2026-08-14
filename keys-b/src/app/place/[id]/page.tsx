import { notFound } from 'next/navigation';
import { CORPUS } from '@/data/corpus';
import { PLACES, PLACE_BY_ID } from '@/data/places';
import { PlaceCard } from './PlaceCard';

// Страница, на которую ведёт QR-код у объекта.
// Отзыв (запись 4): «QR-kodlar… rasmlarda taqlib, tez-tezda tekshirib» —
// турист сканирует код у входа и сразу получает карточку объекта и проверку фактов.

export function generateStaticParams() {
  return PLACES.map((place) => ({ id: place.id }));
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = PLACE_BY_ID[id];
  if (!place) notFound();

  const facts = CORPUS.filter((item) => item.placeId === id);
  return <PlaceCard place={place} facts={facts} />;
}
