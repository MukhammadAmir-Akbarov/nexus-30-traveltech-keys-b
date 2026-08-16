import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CORPUS } from '@/data/corpus';
import { PHOTOS } from '@/data/photos';
import { PLACES, PLACE_BY_ID } from '@/data/places';
import { PlaceCard } from './PlaceCard';

// Страница, на которую ведёт QR-код у объекта.
// Отзыв (запись 4): «QR-kodlar… rasmlarda taqlib, tez-tezda tekshirib» —
// турист сканирует код у входа и сразу получает карточку объекта и проверку фактов.

export function generateStaticParams() {
  return PLACES.map((place) => ({ id: place.id }));
}

/**
 * Заголовок и описание своей страницы у каждого объекта.
 *
 * Раньше все тридцать одна страница отдавали общий заголовок приложения:
 * в списке вкладок они были неразличимы, а ссылка, отправленная в мессенджер,
 * разворачивалась в «TurizmHamroh» вместо названия объекта. Для туристического
 * продукта это не мелочь — ссылками на объекты как раз и делятся.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = PLACE_BY_ID[id];
  if (!place) return { title: 'TurizmHamroh' };
  const photo = PHOTOS[id];
  return {
    title: `${place.name.uz} — TurizmHamroh`,
    description: place.summary.uz,
    openGraph: {
      title: place.name.uz,
      description: place.summary.uz,
      images: photo ? [photo.url] : undefined,
    },
  };
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = PLACE_BY_ID[id];
  if (!place) notFound();

  const facts = CORPUS.filter((item) => item.placeId === id);

  /**
   * Разметка schema.org для поисковиков. Комитету нужна видимость объектов
   * в поиске, а поисковику — координаты, часы и цена в машинном виде,
   * а не в вёрстке. Данные те же, что видит человек, — второй правды нет.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name.uz,
    alternateName: [place.name.ru, place.name.en],
    description: place.summary.uz,
    geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng },
    isAccessibleForFree: !place.ticketUsd,
    ...(place.opens !== undefined && place.closes !== undefined
      ? {
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            opens: clock(place.opens),
            closes: clock(place.closes),
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlaceCard place={place} facts={facts} />
    </>
  );
}

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
