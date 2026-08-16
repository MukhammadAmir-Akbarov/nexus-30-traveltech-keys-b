'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { PlacePhoto } from './PlacePhoto';
import { useTrip } from './TripProvider';
import { PLACES } from '@/data/places';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import { scorePlace } from '@/lib/planner';
import { isWindy, todayWeather } from '@/lib/weather';
import type { DayWeather, Region } from '@/lib/types';

/**
 * Витрина над формой контекста.
 *
 * Главная была формой и тремя ссылками: человек, зашедший первый раз, не
 * понимал, что за продукт перед ним. Здесь то, что видно сразу и без
 * нажатий — погода на сегодня и три объекта под его интересы.
 *
 * Всё показанное настоящее: погода из того же Open-Meteo, что и в маршруте,
 * объекты — по той же функции очков, что и планировщик. Ничего не нарисовано
 * «для красоты».
 */
export function HomeShowcase() {
  const { trip, lang, ready } = useTrip();
  const region: Region = trip.regions[0] ?? 'tashkent';
  const [weather, setWeather] = useState<DayWeather | null>(null);

  // Дата берётся один раз при монтировании: перерисовки не должны дёргать сеть.
  // Начальное состояние, а не ref — ref во время рендера читать нельзя.
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const controller = new AbortController();
    void todayWeather(region, today, controller.signal).then((value) => {
      if (!controller.signal.aborted) setWeather(value);
    });
    return () => controller.abort();
  }, [region, today]);

  // дней до выезда: считаем от сегодняшней даты, отрицательное не показываем
  const daysLeft = (() => {
    if (!trip.startDate) return null;
    const diff = Math.ceil(
      (new Date(trip.startDate + 'T00:00:00').getTime() -
        new Date(today + 'T00:00:00').getTime()) /
        86_400_000,
    );
    return diff >= 0 ? diff : null;
  })();

  // те же очки, что у планировщика: витрина не имеет права советовать одно,
  // а класть в маршрут другое
  const recommended = ready
    ? [...PLACES]
        .map((place) => ({ place, score: scorePlace(place, trip) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.place)
    : [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="muted text-[12px] uppercase tracking-wider">{t('homeOverline', lang)}</div>
          {/*
            Приветствие ушло из h1 в подпись, а заголовком стал вопрос.
            «Здравствуйте, путешественник» — вежливость, а не смысл экрана;
            первым, что человек читает, должен быть вопрос, на который экран
            умеет отвечать. Формулировки лежали в словаре с самого начала
            (homeHeroTitle, homeSearchLabel) и ни разу не выводились.
          */}
          <div className="muted mt-0.5 text-[13px]">{t('homeGreeting', lang)}</div>
          <h1 className="mt-0.5">{t('homeHeroTitle', lang)}</h1>
          <p className="muted prose-measure mt-1 text-[15px]">{t('homeGreetingSub', lang)}</p>
        </div>

        {/* Сколько дней до выезда. Мелочь, но она превращает страницу
            из справочника в «мою поездку». */}
        {daysLeft !== null && (
          <div className="card flex flex-col justify-center py-3">
            {daysLeft === 0 ? (
              <b className="text-[15px]">{t('tripToday', lang)}</b>
            ) : (
              <>
                <span className="muted text-[12px]">{t('tripCountdown', lang)}</span>
                <b className="text-[17px]">
                  {daysLeft} {t('tripDaysLeft', lang)}
                </b>
              </>
            )}
          </div>
        )}

        {weather && (
          <div className="card flex items-center gap-3 py-3">
            <Icon name={weather.precipMm >= 2 ? 'alert' : 'sun'} size={22} />
            <div className="flex flex-col">
              <b className="text-[17px]">+{weather.tMaxC}°</b>
              <span className="muted text-[12px]">
                {tr(REGION_LABEL[weather.region], lang)} ·{' '}
                {t(weather.source === 'forecast' ? 'weatherForecast' : 'weatherNorm', lang)}
              </span>
              {weather.windKmh !== undefined && (
                <span className={isWindy(weather) ? 'text-[12px]' : 'muted text-[12px]'}>
                  {t('windLabel', lang)} {weather.windKmh} {t('windUnit', lang)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/*
        Поиск обычной формой с method=GET, без onSubmit и без роутера: так он
        работает и до гидратации, и с выключенным JS, а строка запроса видна
        в адресе — её можно переслать. Каталог читает `q` при первом рендере.
      */}
      <form action="/places" className="search-bar" role="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          name="q"
          className="search-input"
          placeholder={t('homeSearchLabel', lang)}
          aria-label={t('homeSearchLabel', lang)}
        />
      </form>

      {recommended.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">{t('homeRecommended', lang)}</div>
          {/* Две колонки на телефоне, как в макете: одна колонка растягивала
              три карточки на два экрана и витрина переставала быть витриной. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recommended.map((place) => (
              <Link
                key={place.id}
                href={`/place/${place.id}`}
                className="card card-link flex flex-col gap-2"
              >
                <PlacePhoto placeId={place.id} alt={tr(place.name, lang)} lang={lang} />
                <span className="text-[14px] font-semibold">{tr(place.name, lang)}</span>
                <span className="muted text-[12px]">{tr(REGION_LABEL[place.region], lang)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
