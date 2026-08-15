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
      {MOBILE_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-active={active}
            // aria-current: диктор говорит «текущая страница», а не заставляет
            // догадываться по цвету. Цветом текущую вкладку не отличить на слух.
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={tab.icon} size={20} />
            {/*
              Подпись видна только у текущей вкладки — так в макете. Но из
              разметки она не убирается: под .sr-only её читает экранный
              диктор. Иначе три из четырёх пунктов остались бы без имени.
            */}
            <span className={active ? undefined : 'sr-only'}>{t(tab.key, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
