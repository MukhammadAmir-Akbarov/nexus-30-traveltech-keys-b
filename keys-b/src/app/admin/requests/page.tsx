import { PLACE_BY_ID } from '@/data/places';
import { getGuides, listDisputes, listRequests } from '@/lib/store';
import { AdminRequests } from './AdminRequests';

// Один входящий ящик: жалобы гидов на вердикты, проблемы на объектах
// и запросы гида от туристов. Всё, что приложение получает обратно от людей.

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage() {
  const guides = getGuides();
  const nameOf = (id: string) =>
    guides.find((g) => g.id === id)?.name ?? PLACE_BY_ID[id]?.name.ru ?? id;

  return (
    <AdminRequests
      disputes={listDisputes().map((d) => ({
        id: d.id,
        guideName: nameOf(d.guideId),
        claim: d.claim,
        status: d.status,
        note: d.dispute!.note,
        at: d.dispute!.at,
        resolved: d.dispute!.resolved ?? null,
      }))}
      requests={listRequests().map((r) => ({ ...r, targetName: nameOf(r.targetId) }))}
    />
  );
}
