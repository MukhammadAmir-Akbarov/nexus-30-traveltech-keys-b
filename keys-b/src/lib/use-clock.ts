'use client';

import { useSyncExternalStore } from 'react';
import { tashkentMinutes } from './hours';

/**
 * Текущее время по Ташкенту в минутах от полуночи — или `null`, пока идёт
 * серверный рендер и гидратация.
 *
 * Часы — внешний источник, а не состояние React, поэтому подписка идёт через
 * `useSyncExternalStore`, а не через эффект с `setState`: на сервере часов нет,
 * и разметка разошлась бы с клиентской. `null` в серверном снимке — это честно:
 * до гидратации «сейчас открыто» никто сказать не может.
 */
function subscribe(onChange: () => void): () => void {
  // минуты, а не секунды: чаще этого «открыто/закрыто» не меняется
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}

export function useTashkentMinutes(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => tashkentMinutes(),
    () => null,
  );
}
