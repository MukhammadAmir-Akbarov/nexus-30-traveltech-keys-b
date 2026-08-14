import { listUsers } from '@/lib/store';
import { AdminUsers } from './AdminUsers';

export default async function AdminUsersPage() {
  // пароли наружу не отдаём — только то, что показывает таблица
  const users = listUsers().map((user) => ({
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }));
  return <AdminUsers users={users} />;
}
