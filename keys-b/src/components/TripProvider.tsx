'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TripContext } from '@/lib/types';

// Единый контекст поездки на все три модуля (требование №5 кейса):
// регион и интересы выбираются один раз и используются проверкой фактов,
// маршрутом и подбором гида.

const DEFAULT_TRIP: TripContext = {
  region: 'samarkand',
  interests: ['history', 'architecture'],
  travelType: 'solo',
  days: 3,
};

const STORAGE_KEY = 'nexus30.trip';

type Store = {
  trip: TripContext;
  update: (patch: Partial<TripContext>) => void;
  ready: boolean;
};

const Ctx = createContext<Store | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<TripContext>(DEFAULT_TRIP);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTrip({ ...DEFAULT_TRIP, ...JSON.parse(raw) });
    } catch {
      // повреждённый localStorage — просто стартуем с дефолта
    }
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<TripContext>) => {
    setTrip((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ trip, update, ready }}>{children}</Ctx.Provider>;
}

export function useTrip(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useTrip вызван вне TripProvider');
  return store;
}
