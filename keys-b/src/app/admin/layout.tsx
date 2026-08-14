import { requireAdmin } from '@/lib/session';
import { AdminNav } from './AdminNav';

// Один охранник на весь раздел: без роли admin сюда не попасть.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex flex-col gap-4">
      <AdminNav email={session.email} />
      {children}
    </div>
  );
}
