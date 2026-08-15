import { CLIMATE_PRECIP, CLIMATE_TMAX, REGION_CENTER } from '../data/climate.ts';
import type { DayWeather, Region, WeatherAdvice } from './types.ts';

// Погода маршрута. Три правила и один принцип: погода меняет ПОРЯДОК и бюджет
// дня, но не состав. Иначе турист, приехавший ради Регистана, получит план без
// Регистана из-за двух миллиметров дождя — и это провал, а не забота.
//
// Источник сменный, потому что доступность API партнёра в ТЗ помечена как
// [ANIQLANADI]: прогноз без ключа → климатическая норма без сети.

/** Днём жарче — открытые объекты уходят на утреннюю прохладу. */
export const HEAT_C = 35;
/** Осадки от этого значения — приоритет крытым объектам. */
export const RAIN_MM = 2;
/** Холодный короткий день: темнеет рано, объекты закрываются раньше. */
export const COLD_C = 5;

/**
 * Порог, за которым ветер уже меняет день: на площадях и в степи поднимается
 * пыль. Порядок объектов он не трогает — это сведение, а не правило: выдумывать
 * перестановку из скорости ветра мы не станем.
 */
export const WINDY_KMH = 30;

export function isWindy(weather: DayWeather): boolean {
  return (weather.windKmh ?? 0) >= WINDY_KMH;
}

export function adviceFor(weather: DayWeather): WeatherAdvice {
  if (weather.precipMm >= RAIN_MM) return 'rain';
  if (weather.tMaxC >= HEAT_C) return 'heat';
  if (weather.tMaxC <= COLD_C) return 'short-day';
  return 'fine';
}

/** Климатическая норма месяца. Работает всегда: без сети, без ключа, на любую дату. */
export function climateNorm(region: Region, date: string): DayWeather {
  const month = Math.min(11, Math.max(0, Number(date.slice(5, 7)) - 1));
  const daysInMonth = new Date(Number(date.slice(0, 4)), month + 1, 0).getDate();
  return {
    date,
    region,
    tMaxC: CLIMATE_TMAX[region][month],
    // месячную сумму делим на число дней: для нормы этой точности достаточно
    precipMm: Math.round((CLIMATE_PRECIP[region][month] / daysInMonth) * 10) / 10,
    source: 'norm',
  };
}

/** Даты поездки по дням: без стартовой даты считаем от завтра. */
export function tripDates(days: number, startDate?: string): string[] {
  const start = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

type OpenMeteoDaily = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
};

/**
 * Прогноз Open-Meteo: без ключа и регистрации. Никогда не бросает исключение —
 * план поездки не имеет права упасть из-за погоды.
 */
async function fetchOpenMeteo(
  region: Region,
  dates: string[],
  signal: AbortSignal,
): Promise<DayWeather[] | null> {
  const { lat, lng } = REGION_CENTER[region];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max&timezone=Asia%2FTashkent` +
    `&start_date=${dates[0]}&end_date=${dates[dates.length - 1]}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as OpenMeteoDaily;
    const time = data.daily?.time;
    const tmax = data.daily?.temperature_2m_max;
    const rain = data.daily?.precipitation_sum;
    const wind = data.daily?.wind_speed_10m_max;
    if (!time?.length || !tmax?.length) return null;
    return dates.map((date) => {
      const i = time.indexOf(date);
      // дата за горизонтом прогноза — на этот день берём норму
      if (i < 0 || tmax[i] === undefined) return climateNorm(region, date);
      return {
        date,
        region,
        tMaxC: Math.round(tmax[i]),
        precipMm: rain?.[i] ?? 0,
        windKmh: wind?.[i] === undefined ? undefined : Math.round(wind[i]),
        source: 'forecast' as const,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Погода на сегодня для главной страницы. Прогноз, если сеть ответила,
 * иначе климатическая норма — и подпись в интерфейсе честно говорит, что это.
 */
export async function todayWeather(
  region: Region,
  date: string,
  signal?: AbortSignal,
): Promise<DayWeather> {
  const forecast = await fetchOpenMeteo(region, [date], signal ?? new AbortController().signal);
  return forecast?.[0] ?? climateNorm(region, date);
}

/**
 * Погода по дням маршрута. Прогноз, если получилось; иначе — норма.
 * Таймаут короткий: турист ждёт маршрут, а не погоду.
 */
export async function forecastFor(
  region: Region,
  dates: string[],
  timeoutMs = 3000,
): Promise<DayWeather[]> {
  if (dates.length === 0) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const forecast = await fetchOpenMeteo(region, dates, controller.signal);
    return forecast ?? dates.map((date) => climateNorm(region, date));
  } finally {
    clearTimeout(timer);
  }
}
