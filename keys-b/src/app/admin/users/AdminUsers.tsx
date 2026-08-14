'use client';

import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

type Row = { email: string; role: string; createdAt: string };

export function AdminUsers({ users }: { users: Row[] }) {
  const { lang } = useTrip();

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="muted">
            <th className="pb-2">{t('authEmail', lang)}</th>
            <th className="pb-2">{t('adminRole', lang)}</th>
            <th className="pb-2">{t('adminCreated', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.email} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="py-2">{user.email}</td>
              <td className="py-2">
                <span className="tag">{user.role}</span>
              </td>
              <td className="muted py-2">{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
