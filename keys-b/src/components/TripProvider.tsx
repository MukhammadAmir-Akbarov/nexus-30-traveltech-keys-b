'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang, TripContext } from '@/lib/types';

// Единый контекст поездки на все три модуля (требование №5 кейса):
// регион, интересы и язык выбираются один раз и используются проверкой фактов,
// маршрутом и подбором гида. Здесь же живёт тема оформления.

const DEFAULT_TRIP: TripContext = {
  region: 'samarkand',
  regions: ['samarkand'],
  interests: ['history', 'architecture'],
  travelType: 'solo',
  days: 3,
  lang: 'uz',
  summer: false,
};

export type Theme = 'light' | 'dark' | 'system';

const TRIP_KEY = 'nexus30.trip';
const THEME_KEY = 'nexus30.theme';
const ONBOARDED_KEY = 'nexus30.onboarded';

type Store = {
  trip: TripContext;
  lang: Lang;
  update: (patch: Partial<TripContext>) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  ready: boolean;
  /** Короткий опрос при первом входе уже пройден или пропущен. */
  onboarded: boolean;
  finishOnboarding: () => void;
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
  // до загрузки localStorage считаем опрос пройденным, иначе он мигает на каждом заходе
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIP_KEY);
      if (raw) setTrip({ ...DEFAULT_TRIP, ...JSON.parse(raw) });
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme) setThemeState(savedTheme);
      setOnboarded(localStorage.getItem(ONBOARDED_KEY) === '1');
    } catch {
      // повреждённый localStorage — просто стартуем с дефолта
    }
    setReady(true);
  }, []);

  const finishOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    // фиксируем контекст, даже если в опросе ничего не меняли
    setTrip((prev) => {
      localStorage.setItem(TRIP_KEY, JSON.stringify(prev));
      return prev;
    });
    setOnboarded(true);
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
    <Ctx.Provider
      value={{ trip, lang: trip.lang, update, theme, setTheme, ready, onboarded, finishOnboarding }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTrip(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useTrip вызван вне TripProvider');
  return store;
}
