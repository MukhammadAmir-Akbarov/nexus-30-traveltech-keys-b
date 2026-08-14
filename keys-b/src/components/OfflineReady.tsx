'use client';

import { useEffect, useState } from 'react';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Регистрирует сервис-воркер и показывает плашку, когда сети нет:
// турист должен понимать, что видит сохранённые данные, а не свежие.

export function OfflineReady() {
  const { lang } = useTrip();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // офлайн-режим не критичен: без него приложение просто требует сеть
      });
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="px-4 py-2 text-center text-[13px]"
      style={{ background: 'var(--accent)', color: '#04110f' }}
    >
      {t('offlineBanner', lang)}
    </div>
  );
}
