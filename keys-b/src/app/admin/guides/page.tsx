import { getGuides } from '@/lib/store';
import { AdminGuides } from './AdminGuides';

export default async function AdminGuidesPage() {
  const guides = getGuides().map((guide) => ({
    id: guide.id,
    name: guide.name,
    gender: guide.gender,
    hasTransport: guide.hasTransport,
    languages: guide.languages,
    rating: guide.rating,
    verified: guide.verified,
  }));
  return <AdminGuides initial={guides} />;
}
