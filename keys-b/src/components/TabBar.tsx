'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { TABS } from './Nav';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Нижняя навигация на телефоне: вкладки в шапке недосягаемы большим пальцем,
// а приложением пользуются стоя у объекта, одной рукой.
export function TabBar() {
  const pathname = usePathname();
  const { lang } = useTrip();

  return (
    <nav className="tabbar sm:hidden" aria-label="main">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} data-active={pathname === tab.href}>
          <Icon name={tab.icon} size={20} />
          {t(tab.key, lang)}
        </Link>
      ))}
    </nav>
  );
}
