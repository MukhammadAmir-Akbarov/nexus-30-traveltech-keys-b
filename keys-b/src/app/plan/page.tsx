'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TransferCard } from '@/components/TransferCard';
import { Icon } from '@/components/Icon';
import { NearbyPois } from '@/components/NearbyPois';
import { OfflinePack } from '@/components/OfflinePack';
import { ShareTrip } from '@/components/ShareTrip';
import { SoloPanel } from '@/components/SoloPanel';
import { TripSetup } from '@/components/TripSetup';
import { useTrip } from '@/components/TripProvider';
import { PLACE_BY_ID } from '@/data/places';
import { itineraryToIcs } from '@/lib/ics';
import { prayerTimes, type Prayer } from '@/lib/prayer';
import { t, tr } from '@/lib/i18n';
import { distanceLabel, navigatorUrl, routeTotals } from '@/lib/route';
import { useDayRoutes, type DayPoints } from '@/lib/use-route';
import type { UiKey } from '@/lib/i18n';
import type { RoutePoint } from '@/components/RouteMap';
import type { Itinerary, ItineraryDay, Mode } from '@/lib/types';

// MapLibre трогает window и WebGL — грузим только на клиенте.
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => <div className="card muted text-sm">…</div>,
});

const PRAYER_KEY: Record<Prayer, UiKey> = {
  fajr: 'prayerFajr',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

export default function PlanPage() {
  const { trip, lang, update, ready, onboarded, finishOnboarding } = useTrip();

  // Вопросы о поездке задаются здесь, а не модалкой при первом входе: человек
  // уже нажал «спланировать», и теперь у вопроса есть смысл. Пока на них не
  // ответили ни разу — форма раскрыта; дальше она сворачивается и открывается
  // кнопкой, чтобы не занимать экран над готовым маршрутом.
  const [setupOpen, setSetupOpen] = useState(false);
  const showSetup = setupOpen || (ready && !onboarded);

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

  const build = useCallback(async () => {
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
  }, [trip]);

  // Контекст уже собран на главной — ждать нажатия незачем. Заодно это чинит
  // и смену языка: текст дней и заметок приходит с сервера уже переведённым,
  // иначе половина карточки остаётся на прежнем языке.
  const builtFor = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(trip);
    if (builtFor.current === key) return;
    builtFor.current = key;
    void build();
  }, [trip, build]);

  // маршрут в календарь телефона: файл собирается на клиенте, сеть не нужна
  const downloadIcs = () => {
    if (!itinerary) return;
    const ics = itineraryToIcs(itinerary, new Map(Object.entries(PLACE_BY_ID)), lang, trip.startDate);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus30-trip.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Объекты дня, у которых есть карточка. Одним списком на всё: и точки карты,
  // и строки таймлайна, и переходы — иначе индексы разъезжаются, и «15 минут
  // пешком» встают не к тому объекту.
  const placesOf = (day: ItineraryDay) =>
    day.items.flatMap((item) => {
      const place = PLACE_BY_ID[item.placeId];
      return place ? [{ item, place }] : [];
    });

  const days = itinerary?.days ?? [];

  // точки маршрута с номером дня: карта красит их по дням, легенда не нужна
  const routePoints: RoutePoint[] = days.flatMap((day) =>
    placesOf(day).map(({ place }) => ({ place, day: day.day })),
  );

  // Настоящий маршрут по дорогам: как добраться от объекта к объекту.
  const dayPoints: DayPoints[] = days.map((day) => ({
    day: day.day,
    points: placesOf(day).map(({ place }) => ({ lat: place.lat, lng: place.lng })),
  }));
  const routes = useDayRoutes(dayPoints);
  const routeByDay = new Map(routes.map((route) => [route.day, route]));

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>{t('planTitle', lang)}</h1>
          <p className="muted prose-measure mt-2 text-[15px]">{t('planLead', lang)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            aria-expanded={showSetup}
            aria-controls="trip-setup"
            onClick={() => setSetupOpen((open) => !open)}
          >
            <Icon name="search" />
            {t('planSetupToggle', lang)}
          </button>
          <button className="btn btn-primary" disabled={loading} onClick={build}>
            <Icon name="route" />
            {loading
              ? t('planLoading', lang)
              : itinerary
                ? t('planRebuild', lang)
                : t('planButton', lang)}
          </button>
        </div>
      </section>

      {showSetup && (
        <section id="trip-setup" className="card flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold">{t('planSetupTitle', lang)}</h2>
            <p className="muted prose-measure mt-1 text-[13px]">{t('planSetupHint', lang)}</p>
          </div>

          <TripSetup />

          <div>
            <button
              className="btn btn-primary"
              onClick={() => {
                finishOnboarding();
                setSetupOpen(false);
              }}
            >
              {t('planSetupDone', lang)}
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="card text-sm" style={{ color: 'var(--danger)' }}>
          {t('planError', lang)}
        </div>
      )}

      {loading && !itinerary && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 380 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
      )}

      {itinerary && (
        <>
          <section className="card flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{t('planTotal', lang)}</span>
              <span className="tag" title={mode === 'ai' ? undefined : t('modeOfflineHint', lang)}>
                {mode === 'ai' ? t('planModeAi', lang) : t('modeOffline', lang)}
              </span>
            </div>
            <p className="text-sm">{itinerary.summary}</p>

            {itinerary.cost && itinerary.cost.totalUsd > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
                <span className="muted">{t('planCost', lang)}</span>
                <b className="text-[15px]">≈ ${itinerary.cost.totalUsd}</b>
                <span className="muted">
                  ({t('planCostTickets', lang)} ${itinerary.cost.ticketsUsd} ·{' '}
                  {t('planCostTransfer', lang)} ${itinerary.cost.transferUsd})
                </span>
                <span className="muted text-[12px]">· {t('planCostNote', lang)}</span>
              </div>
            )}
          </section>

          {routePoints.length > 0 && (
            <RouteMap points={routePoints} routes={routes} lang={lang} />
          )}

          <section className="flex flex-col gap-3">
            {itinerary.days.map((day) => (
              <div key={day.day} className="card appear">
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold"
                    style={{ background: 'var(--accent-weak)', color: 'var(--accent)' }}
                  >
                    <Icon name="calendar" size={14} />
                    {t('planDay', lang)} {day.day}
                  </span>
                  <span className="muted text-[13px]">{day.title}</span>

                  {/* Погода дня с подписью источника: прогноз и норма — разные вещи,
                      и выдавать одно за другое приложение не имеет права. */}
                  {day.weather && (
                    <span className="tag" title={t(day.weather.source === 'forecast' ? 'weatherForecastHint' : 'weatherNormHint', lang)}>
                      <Icon name={day.weather.precipMm >= 2 ? 'alert' : 'sun'} size={13} />
                      +{day.weather.tMaxC}° ·{' '}
                      {t(day.weather.source === 'forecast' ? 'weatherForecast' : 'weatherNorm', lang)}
                    </span>
                  )}
                </div>

                {day.weatherNote && (
                  <p className="muted mb-2 prose-measure text-[13px]">{day.weatherNote}</p>
                )}

                {day.seasonNote && (
                  <p
                    className="mb-2 rounded-xl p-2 prose-measure text-[13px]"
                    style={{ background: 'var(--warn-weak)', color: 'var(--warn)' }}
                  >
                    {day.seasonNote}
                  </p>
                )}

                {/* Время намаза показываем только тем, кто выбрал «святыни»:
                    для зиёрат-туризма это важнее прочего, остальным — шум. */}
                {trip.interests.includes('religion') && day.weather && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="muted">{t('prayerTitle', lang)}</span>
                    {Object.entries(prayerTimes(day.weather.region, day.weather.date)).map(
                      ([name, at]) => (
                        <span key={name} className="tag">
                          {t(PRAYER_KEY[name as Prayer], lang)} {at}
                        </span>
                      ),
                    )}
                    <span className="muted">· {t('prayerNote', lang)}</span>
                  </div>
                )}
                {day.transfer && <TransferCard transfer={day.transfer} />}

                {/* Как добраться за день: сколько пешком, сколько на такси
                    и ссылка в навигатор — картинка маршрута никого никуда
                    не приведёт, а голосовая навигация приведёт. */}
                {(() => {
                  const route = routeByDay.get(day.day);
                  if (!route || route.legs.length === 0) return null;
                  const totals = routeTotals(route.legs);
                  const stops = placesOf(day).map(({ place }) => ({
                    lat: place.lat,
                    lng: place.lng,
                  }));
                  return (
                    <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                      <span className="muted inline-flex items-center gap-1.5">
                        <Icon name="route" size={13} />
                        {t('routeHow', lang)}
                      </span>
                      {totals.walkKm > 0 && (
                        <span className="tag">
                          <Icon name="walk" size={13} />
                          {t('legWalk', lang)} {distanceLabel(totals.walkKm).value}{' '}
                          {t(distanceLabel(totals.walkKm).unit === 'm' ? 'legM' : 'legKm', lang)} ·{' '}
                          {totals.walkMinutes} {t('planMinutes', lang)}
                        </span>
                      )}
                      {totals.taxiMinutes > 0 && (
                        <span className="tag">
                          <Icon name="car" size={13} />
                          {t('legTaxi', lang)} {totals.taxiMinutes} {t('planMinutes', lang)} · ≈ $
                          {totals.taxiUsd}
                        </span>
                      )}
                      <a
                        className="underline"
                        style={{ color: 'var(--accent)' }}
                        href={navigatorUrl(stops)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('routeNavigator', lang)}
                      </a>
                    </div>
                  );
                })()}

                <ol className="timeline flex flex-col gap-4">
                  {placesOf(day).map(({ item, place }, index) => {
                    const leg = routeByDay.get(day.day)?.legs[index];
                    return (
                      <li key={item.placeId} className="flex gap-3">
                        <span className="step-dot mt-0.5">{index + 1}</span>
                        <div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[15px] font-semibold">
                            {tr(place.name, lang)}
                            {item.at && (
                              <span className="tag">
                                <Icon name="clock" size={13} />
                                {item.at}
                              </span>
                            )}
                            <span className="tag">
                              {place.visitMinutes} {t('planMinutes', lang)}
                            </span>
                            {place.ticketUsd ? (
                              <span className="tag">${place.ticketUsd}</span>
                            ) : null}
                            {/* закрыт — это надо сказать, а не тихо поставить в план */}
                            {item.closed && (
                              <span className="tag tag-warn">
                                <Icon name="alert" size={13} />
                                {t('planClosed', lang)}
                              </span>
                            )}
                          </div>
                          <div className="muted prose-measure text-[13.5px]">{item.note}</div>

                          {/* Ручная правка: главная ось персонализации, которой не было.
                              Регион и интересы — это про класс объектов, а тут про
                              конкретный: «этот убрать», «этот обязательно». */}
                          <div className="mt-1 flex flex-wrap gap-2">
                            <button
                              className="chip"
                              onClick={() =>
                                update({
                                  excluded: [...(trip.excluded ?? []), item.placeId],
                                  pinned: (trip.pinned ?? []).filter((id) => id !== item.placeId),
                                })
                              }
                            >
                              {t('planExclude', lang)}
                            </button>
                            <button
                              className="chip"
                              data-active={(trip.pinned ?? []).includes(item.placeId)}
                              onClick={() =>
                                update({
                                  pinned: (trip.pinned ?? []).includes(item.placeId)
                                    ? (trip.pinned ?? []).filter((id) => id !== item.placeId)
                                    : [...(trip.pinned ?? []), item.placeId],
                                })
                              }
                            >
                              {t('planPin', lang)}
                            </button>
                          </div>

                          {/* Переход к следующему объекту: расстояние по дорогам,
                              время и цена. Раньше между точками была пустота,
                              и турист не знал, идти ему пешком или брать такси. */}
                          {leg && (
                            <div className="leg-hop muted mt-2 flex items-center gap-1.5 text-[12.5px]">
                              <Icon name={leg.mode === 'walk' ? 'walk' : 'car'} size={14} />
                              {t(leg.mode === 'walk' ? 'legWalk' : 'legTaxi', lang)} ·{' '}
                              {distanceLabel(leg.km).value}{' '}
                              {t(distanceLabel(leg.km).unit === 'm' ? 'legM' : 'legKm', lang)} ·{' '}
                              {leg.minutes} {t('planMinutes', lang)}
                              {leg.fareUsd > 0 && ` · ≈ $${leg.fareUsd}`}
                            </div>
                          )}
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

          {(trip.excluded ?? []).length > 0 && (
            <section className="card flex flex-col gap-2">
              <b className="text-sm">{t('planExcludedTitle', lang)}</b>
              <div className="flex flex-wrap gap-2">
                {(trip.excluded ?? []).map((id) => (
                  <button
                    key={id}
                    className="chip"
                    onClick={() =>
                      update({ excluded: (trip.excluded ?? []).filter((x) => x !== id) })
                    }
                  >
                    {PLACE_BY_ID[id] ? tr(PLACE_BY_ID[id].name, lang) : id} · {t('planRestore', lang)}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* и подсказки одиночке, и «поделиться» имеют смысл только когда маршрут есть */}
          <SoloPanel />

          <section className="card flex flex-wrap items-center gap-2">
            <button className="btn" onClick={downloadIcs}>
              <Icon name="calendar" />
              {t('planIcs', lang)}
            </button>
            <button className="btn" onClick={() => window.print()}>
              {t('planPrint', lang)}
            </button>
          </section>

          <OfflinePack />

          <ShareTrip />
        </>
      )}
    </div>
  );
}
