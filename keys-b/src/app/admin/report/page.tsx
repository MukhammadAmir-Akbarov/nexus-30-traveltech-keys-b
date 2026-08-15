import { PLACE_BY_ID } from '@/data/places';
import { getPlaceFactStats, listGaps } from '@/lib/store';
import { AdminReport } from './AdminReport';

// Отчёт для Комитета по туризму. Пока турист проверяет слова гида, система
// накапливает то, чего у Комитета сегодня нет: карту объектов, вокруг которых
// чаще всего звучит недостоверное. Это не репутация конкретного гида —
// это подсказка, где официальной информации не хватает.

export const dynamic = 'force-dynamic';

export default async function AdminReportPage() {
  const rows = getPlaceFactStats().map((row) => ({
    ...row,
    name: PLACE_BY_ID[row.placeId]?.name ?? null,
    region: PLACE_BY_ID[row.placeId]?.region ?? null,
  }));
  // Второй разрез отчёта: о чём спрашивают, а ответа в источниках нет.
  // Маленький корпус перестаёт быть слабостью и становится поручением.
  const gaps = listGaps()
    .slice(0, 30)
    .map((gap) => ({ ...gap, name: gap.placeId ? (PLACE_BY_ID[gap.placeId]?.name ?? null) : null }));
  return <AdminReport rows={rows} gaps={gaps} />;
}
