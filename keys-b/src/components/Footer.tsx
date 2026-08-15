'use client';

import Link from 'next/link';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

export function Footer() {
  const { lang } = useTrip();
  return (
    <footer
      className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-[12px]"
      style={{ color: 'var(--muted)' }}
    >
      {t('footer', lang)}{' '}
      {/* границы прототипа — в одном клике, а не только в питче */}
      <Link href="/how" className="underline" style={{ color: 'var(--accent)' }}>
        {t('howTitle', lang)}
      </Link>
    </footer>
  );
}
