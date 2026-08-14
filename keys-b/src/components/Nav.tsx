'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrip } from './TripProvider';
import { REGION_LABEL } from '@/data/places';
import { INTEREST_LABEL, TRAVEL_TYPE_LABEL } from '@/lib/labels';

const TABS = [
  { href: '/', label: 'Поездка' },
  { href: '/check', label: 'Проверка фактов' },
  { href: '/plan', label: 'Маршрут' },
  { href: '/guides', label: 'Гиды' },
];

export function Nav() {
  const pathname = usePathname();
  const { trip, ready } = useTrip();

  return (
    <header className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-base font-bold">
          Turizm<span style={{ color: 'var(--accent)' }}>Hamroh</span>
        </Link>
        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="chip"
              data-active={pathname === tab.href}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Полоса общего контекста — видна на всех вкладках */}
      <div
        className="mx-auto max-w-5xl px-4 pb-3 text-[13px]"
        style={{ color: 'var(--muted)' }}
      >
        {ready ? (
          <>
            Контекст поездки:{' '}
            <b style={{ color: 'var(--text)' }}>
              {trip.region === 'all' ? 'весь Узбекистан' : REGION_LABEL[trip.region]}
            </b>{' '}
            · {TRAVEL_TYPE_LABEL[trip.travelType]} · {trip.days} дн. ·{' '}
            {trip.interests.map((i) => INTEREST_LABEL[i]).join(', ') || 'интересы не выбраны'}
          </>
        ) : (
          'Загрузка контекста…'
        )}
      </div>
    </header>
  );
}
