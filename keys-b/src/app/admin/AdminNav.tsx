'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

const TABS: { href: string; key: UiKey }[] = [
  { href: '/admin', key: 'adminStats' },
  { href: '/admin/report', key: 'adminReport' },
  { href: '/admin/guides', key: 'adminGuides' },
  { href: '/admin/facts', key: 'adminFacts' },
  { href: '/admin/users', key: 'adminUsers' },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const { lang } = useTrip();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="me-2 text-lg font-bold">{t('adminTitle', lang)}</h1>
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className="chip" data-active={pathname === tab.href}>
          {t(tab.key, lang)}
        </Link>
      ))}
      <span className="muted ms-auto text-[13px]">{email}</span>
      <button className="chip" onClick={logout}>
        {t('authLogout', lang)}
      </button>
    </div>
  );
}
