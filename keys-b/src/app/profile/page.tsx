'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { PlacePhoto } from '@/components/PlacePhoto';
import { SaveButton } from '@/components/SaveButton';
import { useTrip } from '@/components/TripProvider';
import { PLACE_BY_ID } from '@/data/places';
import { BUDGET_LABEL } from '@/lib/budget';
import {
  GUIDE_LANG_LABEL,
  INTEREST_LABEL,
  REGION_LABEL,
  TRAVEL_TYPE_LABEL,
  t,
  tr,
} from '@/lib/i18n';

// Личный раздел туриста: что он сохранил, что проверил и с каким контекстом
// ездит. Счётчики считаются из того, что действительно есть, — выдуманных
// цифр «12 поездок» здесь нет, потому что поездок мы не считаем.

type HistoryItem = { claim: string; status: string; at: string };

function history(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem('nexus30.checks') ?? '[]') as HistoryItem[];
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const { trip, lang, ready } = useTrip();
  const saved = (trip.saved ?? []).map((id) => PLACE_BY_ID[id]).filter(Boolean);
  const checks = ready ? history() : [];

  const stats = [
    { key: 'profileStatSaved' as const, value: saved.length },
    { key: 'profileStatChecks' as const, value: checks.length },
    { key: 'profileStatPinned' as const, value: (trip.pinned ?? []).length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1>{t('profileTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('profileLead', lang)}</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {stats.map(({ key, value }) => (
          <div key={key} className="card flex flex-col items-center gap-1 py-4">
            <b className="text-2xl">{value}</b>
            <span className="muted text-center text-[12.5px]">{t(key, lang)}</span>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <b className="text-sm">{t('savedTitle', lang)}</b>
          <Link href="/places" className="text-[13px] underline" style={{ color: 'var(--accent)' }}>
            {t('profileFindMore', lang)}
          </Link>
        </div>

        {saved.length === 0 ? (
          <p className="muted text-[13px]">{t('savedEmpty', lang)}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((place) => (
              <Link
                key={place.id}
                href={`/place/${place.id}`}
                className="card card-link flex flex-col gap-2"
              >
                <PlacePhoto placeId={place.id} alt={tr(place.name, lang)} lang={lang} />
                <span className="text-[14px] font-semibold">{tr(place.name, lang)}</span>
                <span className="muted text-[12px]">{tr(REGION_LABEL[place.region], lang)}</span>
                <SaveButton placeId={place.id} compact />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Контекст поездки собран на главной — здесь он просто виден одним
          местом, чтобы не гадать, с какими настройками строится маршрут. */}
      <section className="card flex flex-col gap-2">
        <b className="text-sm">{t('profilePrefs', lang)}</b>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <span className="tag">
            {trip.regions.length
              ? trip.regions.map((r) => tr(REGION_LABEL[r], lang)).join(', ')
              : t('allUzbekistan', lang)}
          </span>
          <span className="tag">{tr(TRAVEL_TYPE_LABEL[trip.travelType], lang)}</span>
          <span className="tag">
            {trip.days} {t('planDaysShort', lang)}
          </span>
          {trip.budget && <span className="tag">{tr(BUDGET_LABEL[trip.budget], lang)}</span>}
          {trip.interests.map((i) => (
            <span key={i} className="tag">
              {tr(INTEREST_LABEL[i], lang)}
            </span>
          ))}
          {(trip.guideLangs ?? []).map((l) => (
            <span key={l} className="tag">
              {tr(GUIDE_LANG_LABEL[l], lang)}
            </span>
          ))}
        </div>
        <Link href="/" className="text-[13px] underline" style={{ color: 'var(--accent)' }}>
          {t('planChange', lang)}
        </Link>
      </section>

      <section className="card flex flex-col gap-2">
        <b className="text-sm">{t('profileChecks', lang)}</b>
        {checks.length === 0 ? (
          <p className="muted text-[13px]">{t('profileChecksEmpty', lang)}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-[13px]">
            {checks.slice(0, 5).map((item) => (
              <li key={item.at + item.claim} className="flex flex-wrap items-center gap-2">
                <Icon name="check" size={13} />
                <span className="prose-measure">{item.claim}</span>
                <span className="muted text-[12px]">{item.at}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/check" className="text-[13px] underline" style={{ color: 'var(--accent)' }}>
          {t('profileCheckMore', lang)}
        </Link>
      </section>
    </div>
  );
}
