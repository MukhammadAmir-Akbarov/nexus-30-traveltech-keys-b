'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { MOBILE_TABS } from './Nav';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Нижняя навигация на телефоне: вкладки в шапке недосягаемы большим пальцем,
// а приложением пользуются стоя у объекта, одной рукой.
// Вкладок здесь меньше, чем в шапке: шесть подписей на 390px не помещаются
// и превращаются в нечитаемую кашу.
export function TabBar() {
  const pathname = usePathname();
  const { lang } = useTrip();

  return (
    <nav className="tabbar sm:hidden" aria-label="main">
      {MOBILE_TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} data-active={pathname === tab.href}>
          <Icon name={tab.icon} size={20} />
          {t(tab.key, lang)}
        </Link>
      ))}
    </nav>
  );
}
