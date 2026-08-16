'use client';

import Link from 'next/link';
import { SECONDARY_TABS } from './Nav';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

export function Footer() {
  const { lang } = useTrip();
  return (
    <footer
      className="mx-auto max-w-5xl px-4 pb-28 pt-4 text-[12px] sm:pb-10"
      style={{ color: 'var(--muted)' }}
    >
      {/*
        Разделы, не поместившиеся в нижнюю панель. Показываем только на телефоне:
        на широком экране они и так стоят в шапке, и дубль там был бы шумом.

        Без этой строки /places, /compare и /profile на 375px недостижимы вообще
        ничем — шапка скрыта, во вкладках их нет. Ссылки живут в подвале, а не
        пятой вкладкой, потому что пять подписей на 390px уже не читаются
        (причина записана рядом с MOBILE_TABS).
      */}
      <nav className="mb-3 flex flex-wrap gap-x-4 gap-y-1 sm:hidden" aria-label="secondary">
        {SECONDARY_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            // py-2: строка в 12px сама по себе даёт цель высотой ~16px,
            // пальцем в такую не попасть
            className="py-2 underline"
            style={{ color: 'var(--accent-ink)' }}
          >
            {t(tab.key, lang)}
          </Link>
        ))}
      </nav>

      {t('footer', lang)}{' '}
      {/* границы прототипа — в одном клике, а не только в питче */}
      <Link href="/how" className="py-2 underline" style={{ color: 'var(--accent-ink)' }}>
        {t('howTitle', lang)}
      </Link>
    </footer>
  );
}
