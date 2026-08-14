import { PLACES } from '@/data/places';
import { getCorpus } from '@/lib/store';
import { AdminFacts } from './AdminFacts';

export default async function AdminFactsPage() {
  const facts = getCorpus().map((item) => ({
    id: item.id,
    text: item.text,
    placeId: item.placeId ?? null,
    sourceUrl: item.source.url,
  }));
  const places = PLACES.map((place) => ({ id: place.id, name: place.name }));
  return <AdminFacts initial={facts} places={places} />;
}
