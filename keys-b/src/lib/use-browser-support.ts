'use client';

import { useSyncExternalStore } from 'react';

/**
 * «Умеет ли этот браузер вот это» — распознавание речи, синтез, сканер QR.
 *
 * Раньше каждая такая проверка была эффектом с setState. Это работало, но
 * лишний раз перерисовывало компонент после монтирования и попадало под
 * правило «не вызывай setState синхронно в эффекте».
 *
 * useSyncExternalStore решает это точнее: на сервере снимок всегда false
 * (браузерных API там нет), на клиенте — настоящая проверка. Подписки нет:
 * поддержка API за время жизни страницы не меняется.
 */
const noop = () => () => {};

export function useBrowserSupport(check: () => boolean): boolean {
  return useSyncExternalStore(
    noop,
    () => check(),
    () => false,
  );
}
