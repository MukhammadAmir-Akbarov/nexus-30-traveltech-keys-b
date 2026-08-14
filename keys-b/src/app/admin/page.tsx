import { PLACES } from '@/data/places';
import { getCorpus, getGuides, listUsers } from '@/lib/store';
import { AdminDashboard } from './AdminDashboard';

export default async function AdminHome() {
  const stats = {
    places: PLACES.length,
    guides: getGuides().length,
    verifiedGuides: getGuides().filter((g) => g.verified).length,
    facts: getCorpus().length,
    users: listUsers().length,
  };
  return <AdminDashboard stats={stats} />;
}
