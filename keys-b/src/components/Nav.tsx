'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrip, type Theme } from './TripProvider';
import {
  INTEREST_LABEL,
  LANGS,
  LANG_LABEL,
  REGION_LABEL,
  TRAVEL_TYPE_LABEL,
  t,
  tr,
} from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

const TABS: { href: string; key: UiKey }[] = [
  { href: '/', key: 'tabTrip' },
  { href: '/check', key: 'tabCheck' },
  { href: '/plan', key: 'tabPlan' },
  { href: '/guides', key: 'tabGuides' },
];

const THEME_ICON: Record<Theme, string> = { light: '☀', dark: '☾', system: '◐' };
const THEME_NEXT: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
const THEME_KEY: Record<Theme, UiKey> = {
  light: 'themeLight',
  dark: 'themeDark',
  system: 'themeSystem',
};

export function Nav() {
  const pathname = usePathname();
  const { trip, lang, update, theme, setTheme, ready } = useTrip();

  return (
    <header className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-base font-bold">
          Turizm<span style={{ color: 'var(--accent)' }}>{t('brandSuffix', lang)}</span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="chip"
              data-active={pathname === tab.href}
            >
              {t(tab.key, lang)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {LANGS.map((code) => (
            <button
              key={code}
              className="chip"
              data-active={lang === code}
              onClick={() => update({ lang: code })}
              title={LANG_LABEL[code]}
            >
              {code.toUpperCase()}
            </button>
          ))}
          <button
            className="chip"
            onClick={() => setTheme(THEME_NEXT[theme])}
            title={t(THEME_KEY[theme], lang)}
            aria-label={t(THEME_KEY[theme], lang)}
          >
            {THEME_ICON[theme]}
          </button>
        </div>
      </div>

      {/* Полоса общего контекста — видна на всех вкладках */}
      <div className="mx-auto max-w-5xl px-4 pb-3 text-[13px]" style={{ color: 'var(--muted)' }}>
        {ready ? (
          <>
            {t('contextPrefix', lang)}{' '}
            <b style={{ color: 'var(--text)' }}>
              {trip.region === 'all'
                ? t('allUzbekistan', lang)
                : tr(REGION_LABEL[trip.region], lang)}
            </b>{' '}
            · {tr(TRAVEL_TYPE_LABEL[trip.travelType], lang)} · {trip.days}{' '}
            {t('daysShort', lang)} ·{' '}
            {trip.interests.map((i) => tr(INTEREST_LABEL[i], lang)).join(', ') ||
              t('noInterests', lang)}
          </>
        ) : (
          t('contextLoading', lang)
        )}
      </div>
    </header>
  );
}
