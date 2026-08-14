'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TransferCard } from '@/components/TransferCard';
import { NearbyPois } from '@/components/NearbyPois';
import { ShareTrip } from '@/components/ShareTrip';
import { SoloPanel } from '@/components/SoloPanel';
import { useTrip } from '@/components/TripProvider';
import { PLACE_BY_ID } from '@/data/places';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { Itinerary, Mode, Place } from '@/lib/types';

// Leaflet трогает window — грузим только на клиенте.
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => <div className="card muted text-sm">…</div>,
});

export default function PlanPage() {
  const { trip, lang, update } = useTrip();

  // сюда попадают по ссылке «поделиться поездкой»: /plan?trip=<контекст>
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get('trip');
    if (!encoded) return;
    try {
      update(JSON.parse(decodeURIComponent(atob(encoded))));
    } catch {
      // ссылка битая — остаёмся со своим контекстом
    }
  }, [update]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [mode, setMode] = useState<Mode>('offline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const build = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { itinerary: Itinerary; mode: Mode };
      setItinerary(data.itinerary);
      setMode(data.mode);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const orderedPlaces: Place[] =
    itinerary?.days
      .flatMap((day) => day.items)
      .map((item) => PLACE_BY_ID[item.placeId])
      .filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('planTitle', lang)}</h1>
          <p className="muted mt-1 text-sm">
            {t('planLead', lang)}{' '}
            <Link href="/" className="underline" style={{ color: 'var(--accent)' }}>
              {t('planChange', lang)}
            </Link>
          </p>
        </div>
        <button className="btn btn-primary" disabled={loading} onClick={build}>
          {loading ? t('planLoading', lang) : t('planButton', lang)}
        </button>
      </section>

      <SoloPanel />
      <ShareTrip />

      {error && (
        <div className="card text-sm" style={{ color: 'var(--danger)' }}>
          {t('planError', lang)}
        </div>
      )}

      {itinerary && (
        <>
          <section className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{t('planTotal', lang)}</span>
              <span className="tag">
                {mode === 'ai' ? t('planModeAi', lang) : t('modeOffline', lang)}
              </span>
            </div>
            <p className="text-sm">{itinerary.summary}</p>
          </section>

          {orderedPlaces.length > 0 && <RouteMap places={orderedPlaces} lang={lang} />}

          <section className="flex flex-col gap-3">
            {itinerary.days.map((day) => (
              <div key={day.day} className="card">
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold">
                    {t('planDay', lang)} {day.day}
                  </span>
                  <span className="muted text-[13px]">{day.title}</span>
                </div>
                {day.transfer && <TransferCard transfer={day.transfer} />}
                <ol className="flex flex-col gap-3">
                  {day.items.map((item, index) => {
                    const place = PLACE_BY_ID[item.placeId];
                    if (!place) return null;
                    return (
                      <li key={item.placeId} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                          style={{ background: 'var(--accent)', color: '#04110f' }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold">
                            {tr(place.name, lang)}{' '}
                            <span className="muted font-normal">
                              · {tr(REGION_LABEL[place.region], lang)} · {place.visitMinutes}{' '}
                              {t('planMinutes', lang)}
                            </span>
                          </div>
                          <div className="muted text-[13px]">{item.note}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {(() => {
                  const anchor = PLACE_BY_ID[day.items[0]?.placeId];
                  return anchor ? (
                    <div className="mt-3">
                      <NearbyPois place={anchor} />
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
