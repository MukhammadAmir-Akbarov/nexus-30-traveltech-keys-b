import { listAudit } from '@/lib/store';
import { AdminAudit } from './AdminAudit';

// Журнал действий панели.
//
// Панель Комитета снимает подтверждение с гида, удаляет факты и закрывает
// возражения — и до сих пор нигде не оставалось следа, кто это сделал.
// Для государственного заказчика это не украшение: без журнала любое решение
// в панели одновременно неоспоримо и безответно.

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  return <AdminAudit rows={listAudit().slice(0, 100)} />;
}
