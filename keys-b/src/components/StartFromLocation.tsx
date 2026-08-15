'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { nearestRegion } from '@/lib/geo';
import { REGION_LABEL, t, tr } from '@/lib/i18n';

/**
 * «Я уже здесь» — определить город старта по координатам.
 *
 * §9 кейса требует учитывать защиту данных, поэтому обещание сформулировано
 * так, чтобы его можно было проверить по коду, а не поверить на слово:
 * координаты не уходят на сервер вообще. geolocation отдаёт их в браузер,
 * nearestRegion() считает ближайший город локально, и дальше в контекст
 * поездки попадает только название региона — ровно то, что турист выбрал бы
 * пальцем из списка рядом.
 *
 * Разрешение спрашивается по нажатию, а не при загрузке страницы: системный
 * запрос, выскочивший сам по себе, люди закрывают не читая.
 */

type State =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'denied' }
  | { kind: 'unsupported' }
  | { kind: 'too-far' }
  | { kind: 'failed' };

export function StartFromLocation() {
  const { lang, update } = useTrip();
  const [state, setState] = useState<State>({ kind: 'idle' });

  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ kind: 'unsupported' });
      return;
    }
    setState({ kind: 'asking' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const found = nearestRegion(position.coords.latitude, position.coords.longitude);
        if (!found) {
          // человек далеко от наших городов — врать «вы в Ташкенте» нельзя
          setState({ kind: 'too-far' });
          return;
        }
        update({ startRegion: found.region });
        setState({ kind: 'idle' });
      },
      (error) => {
        setState({ kind: error.code === error.PERMISSION_DENIED ? 'denied' : 'failed' });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const message =
    state.kind === 'denied'
      ? t('geoDenied', lang)
      : state.kind === 'unsupported'
        ? t('geoUnsupported', lang)
        : state.kind === 'too-far'
          ? t('geoTooFar', lang)
          : state.kind === 'failed'
            ? t('geoFailed', lang)
            : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <button className="chip" onClick={detect} disabled={state.kind === 'asking'}>
          <Icon name="pin" size={14} />
          {state.kind === 'asking' ? t('geoAsking', lang) : t('geoDetect', lang)}
        </button>
      </div>

      {/* Обещание стоит рядом с кнопкой, а не в политике мелким шрифтом */}
      <p className="muted text-[12px]">{t('geoPrivacy', lang)}</p>

      {message && (
        <p className="text-[12px]" style={{ color: 'var(--warn)' }} role="status">
          {message}
        </p>
      )}
    </div>
  );
}

/** Подпись «вы здесь» рядом с выбранным городом — чтобы выбор не выглядел случайным. */
export function StartRegionLabel() {
  const { trip, lang } = useTrip();
  if (!trip.startRegion) return null;
  return (
    <span className="muted text-[12px]">
      {t('geoStartIs', lang)} {tr(REGION_LABEL[trip.startRegion], lang)}
    </span>
  );
}
