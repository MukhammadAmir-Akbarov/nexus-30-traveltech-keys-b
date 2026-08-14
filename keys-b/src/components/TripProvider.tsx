'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang, TripContext } from '@/lib/types';

// Единый контекст поездки на все три модуля (требование №5 кейса):
// регион, интересы и язык выбираются один раз и используются проверкой фактов,
// маршрутом и подбором гида. Здесь же живёт тема оформления.

const DEFAULT_TRIP: TripContext = {
  region: 'samarkand',
  interests: ['history', 'architecture'],
  travelType: 'solo',
  days: 3,
  lang: 'uz',
};

export type Theme = 'light' | 'dark' | 'system';

const TRIP_KEY = 'nexus30.trip';
const THEME_KEY = 'nexus30.theme';

type Store = {
  trip: TripContext;
  lang: Lang;
  update: (patch: Partial<TripContext>) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  ready: boolean;
};

const Ctx = createContext<Store | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = theme;
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<TripContext>(DEFAULT_TRIP);
  const [theme, setThemeState] = useState<Theme>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIP_KEY);
      if (raw) setTrip({ ...DEFAULT_TRIP, ...JSON.parse(raw) });
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme) setThemeState(savedTheme);
    } catch {
      // повреждённый localStorage — просто стартуем с дефолта
    }
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<TripContext>) => {
    setTrip((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(TRIP_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  return (
    <Ctx.Provider value={{ trip, lang: trip.lang, update, theme, setTheme, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTrip(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useTrip вызван вне TripProvider');
  return store;
}
