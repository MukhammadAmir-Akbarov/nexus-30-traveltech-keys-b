import type { MetadataRoute } from 'next';
import { PLACES } from '@/data/places';

// Карта сайта: тридцать один объект с собственными страницами не был виден
// поисковику вовсе — на них вели только QR-коды и внутренние ссылки. Для
// Комитета видимость объектов в поиске — это и есть смысл публикации.

/** Адрес площадки. Без переменной сборка не падает — берётся локальный. */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/check', '/plan', '/places', '/guides', '/compare', '/how', '/qr'];
  return [
    ...pages.map((path) => ({ url: `${SITE}${path}`, changeFrequency: 'weekly' as const })),
    ...PLACES.map((place) => ({
      url: `${SITE}/place/${place.id}`,
      changeFrequency: 'monthly' as const,
    })),
  ];
}
