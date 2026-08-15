'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';
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

export const TABS: { href: string; key: UiKey; icon: IconName }[] = [
  { href: '/', key: 'tabTrip', icon: 'pin' },
  { href: '/check', key: 'tabCheck', icon: 'shield' },
  { href: '/plan', key: 'tabPlan', icon: 'route' },
  { href: '/compare', key: 'tabCompare', icon: 'search' },
  { href: '/guides', key: 'tabGuides', icon: 'user' },
];

const THEME_NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'light' };
const THEME_ICON: Record<Theme, IconName> = { light: 'moon', dark: 'sun' };
const THEME_LABEL: Record<Theme, UiKey> = { light: 'themeDark', dark: 'themeLight' };

export function Nav() {
  const pathname = usePathname();
  const { trip, lang, update, theme, setTheme, ready } = useTrip();

  const context = ready
    ? [
        trip.regions.length
          ? trip.regions.map((r) => tr(REGION_LABEL[r], lang)).join(' · ')
          : t('allUzbekistan', lang),
        tr(TRAVEL_TYPE_LABEL[trip.travelType], lang),
        `${trip.days} ${t('daysShort', lang)}`,
        trip.interests.map((i) => tr(INTEREST_LABEL[i], lang)).join(', '),
      ].filter(Boolean)
    : [];

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* flex-wrap: на узком экране группа языков и темы уходит на вторую строку,
          иначе она вылезает за край и появляется горизонтальный скролл */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/" className="py-2 text-[17px] font-bold tracking-tight">
          Turizm<span style={{ color: 'var(--accent)' }}>{t('brandSuffix', lang)}</span>
        </Link>

        {/* на телефоне вкладки живут внизу, под пальцем */}
        <nav className="ms-2 hidden gap-1 sm:flex">
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
          <Link
            href="/login"
            className="chip hidden sm:inline-flex"
            data-active={pathname === '/login'}
          >
            {t('authLogin', lang)}
          </Link>

          {/* переключатель языка одной группой, а не тремя отдельными кнопками */}
          <div
            className="flex overflow-hidden"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface)',
            }}
          >
            {LANGS.map((code) => (
              <button
                key={code}
                onClick={() => update({ lang: code })}
                title={LANG_LABEL[code]}
                aria-pressed={lang === code}
                className="px-3 py-2 text-[13px] font-semibold transition-colors"
                style={{
                  minHeight: 44,
                  cursor: 'pointer',
                  background: lang === code ? 'var(--accent)' : 'transparent',
                  color: lang === code ? 'var(--on-accent)' : 'var(--muted)',
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className="btn"
            style={{ minWidth: 44, padding: 10 }}
            onClick={() => setTheme(THEME_NEXT[theme])}
            title={t(THEME_LABEL[theme], lang)}
            aria-label={t(THEME_LABEL[theme], lang)}
          >
            <Icon name={THEME_ICON[theme]} />
          </button>
        </div>
      </div>

      {/* Полоса общего контекста: один взгляд — и понятно, для кого собирается всё дальше */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 pb-3 text-[13px]">
        <span className="muted">{t('contextPrefix', lang)}</span>
        {ready ? (
          context.map((part) => (
            <span key={part} className="tag">
              {part}
            </span>
          ))
        ) : (
          <span className="skeleton" style={{ width: 220, height: 20 }} />
        )}
      </div>
    </header>
  );
}
