'use client';

import Link from 'next/link';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

export function Footer() {
  const { lang } = useTrip();
  return (
    <footer
      className="mx-auto max-w-5xl px-4 pb-28 pt-4 text-[12px] sm:pb-10"
      style={{ color: 'var(--muted)' }}
    >
      {t('footer', lang)}{' '}
      {/* границы прототипа — в одном клике, а не только в питче */}
      <Link href="/how" className="underline" style={{ color: 'var(--accent-ink)' }}>
        {t('howTitle', lang)}
      </Link>
    </footer>
  );
}
