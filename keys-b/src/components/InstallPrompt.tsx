'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

/**
 * Кнопка «установить приложение».
 *
 * Установка работала и до неё — через меню Chrome, но об этом знает не каждый.
 * Туристу у объекта нужен ярлык на домашнем экране: приложение открывается
 * без адресной строки и работает офлайн, а именно офлайн мы и обещаем.
 *
 * ГЛАВНОЕ РЕШЕНИЕ: кнопки нет, пока браузер сам не скажет, что установка
 * возможна. Событие beforeinstallprompt приходит только там, где установка
 * действительно доступна: не в Firefox, не в iOS Safari, не в уже
 * установленном приложении. Показывать кнопку «установить», которая ничего
 * не сделает, — это ровно тот жанр обещаний, который продукт и опровергает.
 *
 * Поэтому состояние начинается с null и меняется ТОЛЬКО из обработчика
 * события. Проверять display-mode отдельно не нужно: в установленном
 * приложении событие не приходит вовсе.
 *
 * iOS сюда не попадает — Apple не поддерживает beforeinstallprompt. Там
 * работает «Добавить на экран Домой» из меню, и единственное, что нужно от
 * нас, — иконка: apple-icon.svg рядом с layout.
 */

/** У события нет типа в TS DOM: оно нестандартное и живёт только в Chromium. */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const { lang } = useTrip();
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // без preventDefault Chrome покажет собственную плашку внизу экрана,
      // и она встанет поверх нашей плавающей панели вкладок
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    // повторно то же событие использовать нельзя — браузер отдаёт его один раз
    setEvent(null);
  }, [event]);

  if (!event) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-4">
      <button className="btn" onClick={() => void install()}>
        <Icon name="share" size={18} />
        {t('installApp', lang)}
      </button>
      <p className="muted mt-2 text-[12.5px]">{t('installHint', lang)}</p>
    </div>
  );
}
