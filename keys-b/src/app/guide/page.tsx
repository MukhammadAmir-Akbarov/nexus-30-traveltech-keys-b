import { PLACE_BY_ID } from '@/data/places';
import { requireGuide } from '@/lib/session';
import {
  getAccuracy,
  getAccuracyByPlace,
  getGuides,
  listRequestsForGuide,
  listVerdictsForGuide,
} from '@/lib/store';
import { GuidePanel } from './GuidePanel';

// Своя сторона гида. До этого гид был строкой в базе: система считала его
// точность и показывала её туристам, а он не видел ни цифры, ни утверждений,
// на которых она построена, и не мог возразить. Комитет спросит об этом первым.

export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const session = await requireGuide();
  const guide = getGuides().find((g) => g.id === session.guideId);
  if (!guide) return <div className="card">—</div>;

  const verdicts = listVerdictsForGuide(guide.id).map((v) => ({
    ...v,
    placeName: v.placeId ? (PLACE_BY_ID[v.placeId]?.name ?? null) : null,
  }));

  return (
    <GuidePanel
      name={guide.name}
      email={session.email}
      accuracy={getAccuracy()[guide.id] ?? { confirmed: 0, refuted: 0, unclear: 0 }}
      byPlace={getAccuracyByPlace()[guide.id] ?? {}}
      verdicts={verdicts}
      requests={listRequestsForGuide(guide.id)}
    />
  );
}
