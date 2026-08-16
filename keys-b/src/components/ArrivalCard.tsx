'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from './Icon';
import { PlacePhoto } from './PlacePhoto';
import { useTrip } from './TripProvider';
import { photoFor } from '@/data/photos';
import { briefingFor, type Briefing } from '@/lib/briefing';
import { AT_PLACE_LIMIT_M, nearestPlace } from '@/lib/geo';
import { PLACE_BY_ID } from '@/data/places';
import { tr } from '@/lib/i18n';
import type { I18nText, Lang } from '@/lib/types';

/**
 * «Вы пришли на объект» — брифинг ДО экскурсии.
 *
 * ЗАЧЕМ ЭТО ГЛАВНОЕ, А НЕ УКРАШЕНИЕ. Весь продукт проверяет гида ПОСЛЕ того,
 * как он что-то сказал. Здесь порядок обратный: турист узнаёт, что его ждёт,
 * ещё до первого слова гида. Отсюда два следствия, которых не было раньше.
 *
 * Первое: турист знает, что внутри комплекса, и может ПОПРОСИТЬ показать —
 * «мы зайдём в медресе Шердор?». Раньше он даже не знал, что там спросить.
 * Второе: если рассказ гида расходится с тем, что турист уже прочитал из
 * источников, это видно сразу, а не после поездки.
 *
 * ЧТО ЗДЕСЬ НЕ ПРОИСХОДИТ. Ни одного сочинённого предложения. Факты берутся
 * из corpus.ts вместе со своими источниками (briefingFor), модель не
 * вызывается вовсе. Продукт, который ловит гида на непроверяемом утверждении,
 * сам произносить непроверяемое не имеет права.
 *
 * ПРИВАТНОСТЬ. Координаты никуда не уходят: geolocation отдаёт их браузеру,
 * nearestPlace() считает расстояние здесь же, на клиенте, по таблице объектов.
 * На сервер не уезжает ни широта, ни долгота, ни название объекта. Это не
 * обещание в политике, а свойство кода — проверяется вкладкой Network.
 */

type Phase =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'found'; briefing: Briefing; meters: number; simulated: boolean }
  | { kind: 'empty' }
  | { kind: 'denied' }
  | { kind: 'unsupported' };

/*
 * Строки живут здесь, а не в общем словаре: i18n.ts принадлежит другому
 * агенту и сейчас в слиянии. Тот же приём уже применён в planner.ts —
 * модуль держит свои формулировки при себе. После слияния переезжает в
 * общий словарь одним движением, ключи менять не придётся.
 */
const TEXT = {
  title: {
    uz: 'Siz obyekt yonidasiz',
    ru: 'Вы рядом с объектом',
    en: 'You are at a site',
  },
  // Объект найден — заголовок называет его по имени. «Вы рядом с объектом»
  // после определения места звучит как отписка: человек стоит у Регистана,
  // и экран обязан сказать именно это.
  foundTitle: {
    uz: 'Siz {name} oldidasiz',
    ru: 'Вы находитесь у объекта «{name}»',
    en: 'You are standing at {name}',
  },
  lead: {
    uz: 'Gid so‘z boshlashidan oldin — bu yerda nima borligi va manbalar nima deyishi.',
    ru: 'До первого слова гида — что здесь есть и что говорят источники.',
    en: 'Before the guide says a word — what is here and what the sources say.',
  },
  enable: {
    uz: 'Joylashuvni aniqlash',
    ru: 'Определить, где я',
    en: 'Find where I am',
  },
  locating: {
    uz: 'Aniqlanmoqda…',
    ru: 'Определяем…',
    en: 'Locating…',
  },
  denied: {
    uz: 'Joylashuvga ruxsat berilmadi. Quyidagi misollardan birini tanlashingiz mumkin.',
    ru: 'Доступ к геопозиции не дан. Можно выбрать один из примеров ниже.',
    en: 'Location access was denied. You can pick one of the examples below.',
  },
  unsupported: {
    uz: 'Brauzer joylashuvni qo‘llab-quvvatlamaydi.',
    ru: 'Браузер не поддерживает геолокацию.',
    en: 'This browser does not support geolocation.',
  },
  empty: {
    uz: 'Yaqin atrofda bizga ma’lum obyekt yo‘q. Yaqinlashganda o‘zi ochiladi.',
    ru: 'Рядом нет объекта из нашей базы. Откроется само, когда подойдёте.',
    en: 'No known site nearby. It will open by itself once you arrive.',
  },
  meters: { uz: 'metr', ru: 'м', en: 'm' },
  minutes: { uz: 'daqiqa', ru: 'мин', en: 'min' },
  visit: {
    uz: 'Ko‘rish uchun',
    ru: 'На осмотр',
    en: 'Time to visit',
  },
  willSee: {
    uz: 'Bu yerda nimani ko‘rasiz',
    ru: 'Что вы здесь увидите',
    en: 'What you will see here',
  },
  askGuide: {
    uz: 'Gid buni ko‘rsatmasa — so‘rang.',
    ru: 'Если гид этого не покажет — попросите.',
    en: 'If the guide skips it — ask for it.',
  },
  facts: {
    uz: 'Manbalardan',
    ru: 'Из источников',
    en: 'From the sources',
  },
  contested: {
    uz: 'Manbalar kelishmaydi',
    ru: 'Источники расходятся',
    en: 'Sources disagree',
  },
  thin: {
    uz: 'Bu obyekt bo‘yicha korpusda material kam — hammasi shu.',
    ru: 'По этому объекту в корпусе мало материала — это всё, что есть.',
    en: 'The corpus holds little on this site — this is all of it.',
  },
  checkCta: {
    uz: 'Gid aytganini tekshirish',
    ru: 'Проверить слова гида',
    en: 'Check what the guide said',
  },
  moreCta: {
    uz: 'Obyekt haqida to‘liq',
    ru: 'Подробно об объекте',
    en: 'More about this site',
  },
  notifyOn: {
    uz: 'Kelganda bildirishnoma',
    ru: 'Уведомлять при подходе',
    en: 'Notify me on arrival',
  },
  notifyReady: {
    uz: 'Bildirishnoma yoqilgan',
    ru: 'Уведомления включены',
    en: 'Notifications on',
  },
  notifyDenied: {
    uz: 'Bildirishnomaga ruxsat berilmadi',
    ru: 'Уведомления запрещены',
    en: 'Notifications blocked',
  },
  demoTitle: {
    uz: 'Zalda GPS Samarqandni ko‘rsatmaydi — namoyish uchun:',
    ru: 'В зале GPS не покажет Самарканд — для показа:',
    en: 'GPS will not show Samarkand in the hall — for the demo:',
  },
  demoNote: {
    uz: 'Bu tugma koordinatani almashtiradi, natijani emas: quyidagi hamma narsa haqiqiy hisob-kitobdan o‘tadi.',
    ru: 'Кнопка подставляет координату, а не результат: всё ниже проходит настоящий расчёт.',
    en: 'The button substitutes a coordinate, not a result: everything below goes through the real computation.',
  },
  simulated: {
    uz: 'Koordinata namoyish uchun qo‘yilgan',
    ru: 'Координата подставлена для показа',
    en: 'Coordinate substituted for the demo',
  },
  privacy: {
    uz: 'Koordinatangiz serverga yuborilmaydi — hisob brauzerda bajariladi.',
    ru: 'Координата не уходит на сервер — расчёт выполняется в браузере.',
    en: 'Your coordinates never leave the browser — the maths runs locally.',
  },
  watching: {
    uz: 'Kuzatuv yoqilgan',
    ru: 'Слежение включено',
    en: 'Watching your position',
  },
  watchNote: {
    uz: 'Obyektga yaqinlashsangiz, karta o‘zi ochiladi — tugma bosish shart emas.',
    ru: 'Подойдёте к объекту — карточка откроется сама, нажимать ничего не нужно.',
    en: 'Walk up to a site and the card opens by itself — no button needed.',
  },
} satisfies Record<string, I18nText>;

/** Объекты для показа: координаты настоящие, из того же датасета. */
const DEMO_PLACE_IDS = ['registan', 'gur-emir', 'poi-kalyan'];

/*
 * Разрешение на уведомления читается через useSyncExternalStore, а не через
 * useEffect + setState. Причина в том, что Notification на сервере не
 * существует: при рендере его трогать нельзя, а «прочитать после монтирования
 * и положить в состояние» — это лишний проход и предупреждение линтера.
 *
 * useSyncExternalStore для того и сделан: серверный снимок отдаёт 'default',
 * клиентский — настоящее значение. Событий у Notification.permission нет,
 * поэтому подписчиков дёргаем сами, после запроса разрешения.
 */
const permissionListeners = new Set<() => void>();

function subscribePermission(onChange: () => void): () => void {
  permissionListeners.add(onChange);
  return () => permissionListeners.delete(onChange);
}

function readPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** На сервере разрешения нет и быть не может — рендерим нейтральное состояние. */
function serverPermission(): NotificationPermission | 'unsupported' {
  return 'default';
}

function t(key: keyof typeof TEXT, lang: Lang): string {
  return TEXT[key][lang];
}

export function ArrivalCard() {
  const { lang } = useTrip();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const notify = useSyncExternalStore(subscribePermission, readPermission, serverPermission);
  // Уведомление на один и тот же объект показываем один раз: подряд две
  // одинаковые плашки читаются как сбой, а не как забота.
  const notified = useRef<string | null>(null);
  const watchId = useRef<number | null>(null);
  const [watching, setWatching] = useState(false);

  /** Общий путь для настоящего GPS и для показа: разница только в источнике координат. */
  const resolve = useCallback(
    (lat: number, lng: number, simulated: boolean) => {
      const near = nearestPlace(lat, lng);
      if (!near) {
        setPhase({ kind: 'empty' });
        return;
      }
      const briefing = briefingFor(near.place.id, lang);
      if (!briefing) {
        setPhase({ kind: 'empty' });
        return;
      }
      setPhase({ kind: 'found', briefing, meters: Math.round(near.meters), simulated });

      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        notified.current !== near.place.id
      ) {
        notified.current = near.place.id;
        // Тело уведомления — первый факт из источника, а не рекламная фраза:
        // человек должен получить пользу, не открывая приложение.
        new Notification(briefing.name, {
          body: briefing.facts[0]?.text ?? briefing.summary,
          icon: photoFor(near.place.id)?.url ?? '/icon.svg',
          tag: `arrival-${near.place.id}`,
        });
      }
    },
    [lang],
  );

  /**
   * Слежение. До этого брифинг открывался только по кнопке, а обещание
   * продукта звучит иначе: «подошёл к объекту — узнал о нём ДО гида».
   * Нажатие кнопки в этот момент уже проигрыш: человек стоит в группе,
   * гид начал говорить, доставать телефон и что-то жать поздно.
   *
   * Точность нарочно НЕ высокая: радиус узнавания — 500 м (AT_PLACE_LIMIT_M),
   * для такого попадания хватает сети и Wi-Fi, а enableHighAccuracy держит
   * GPS-приёмник включённым и сажает батарею на весь день экскурсии.
   *
   * Само по себе слежение разрешения не просит: старт только там, где оно
   * уже выдано. Спрашивать геопозицию на открытии страницы — приём, за
   * который браузеры штрафуют, а человек закрывает вкладку.
   */
  const startWatch = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Пока рядом ничего нет — молчим. Иначе карточка, открытая минуту
        // назад, схлопнулась бы в «рядом ничего» на первом шаге в сторону.
        if (!nearestPlace(pos.coords.latitude, pos.coords.longitude)) return;
        resolve(pos.coords.latitude, pos.coords.longitude, false);
      },
      // Ошибка одного замера — не повод гасить слежение: следующий может
      // прийти через секунду. Экран при этом не трогаем.
      () => {},
      { enableHighAccuracy: false, timeout: 30_000, maximumAge: 30_000 },
    );
    setWatching(true);
  }, [resolve]);

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPhase({ kind: 'unsupported' });
      return;
    }
    setPhase({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(pos.coords.latitude, pos.coords.longitude, false);
        // Разрешение только что получено — с этой секунды следим сами.
        startWatch();
      },
      () => setPhase({ kind: 'denied' }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [resolve, startWatch]);

  // Разрешение могли выдать в прошлый раз — тогда ничего спрашивать не нужно,
  // просто продолжаем следить с момента открытия экрана.
  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === 'granted') startWatch();
      })
      .catch(() => {
        /* Safari до 16 не умеет спрашивать про геопозицию — останется кнопка */
      });
    return () => {
      cancelled = true;
    };
  }, [startWatch]);

  // Уходя с экрана, приёмник за собой выключаем.
  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  const askNotify = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    await Notification.requestPermission();
    // У разрешения нет своего события — сообщаем подписчикам сами.
    permissionListeners.forEach((listener) => listener());
  }, []);

  const simulate = useCallback(
    (placeId: string) => {
      const place = PLACE_BY_ID[placeId];
      if (place) resolve(place.lat, place.lng, true);
    },
    [resolve],
  );

  const found = phase.kind === 'found' ? phase : null;

  /*
   * Демо-кнопки живут в переменной, потому что их место на экране зависит от
   * того, есть ли уже брифинг.
   *
   * Пока брифинга нет, экран пустой, а GPS в зале Самарканд не покажет: если
   * кнопки лежат внизу, под пустотой, судья видит неработающий экран и
   * уходит. Поэтому без брифинга они идут сразу под кнопкой геопозиции.
   * Когда брифинг открыт, они наоборот мешают — и уезжают под него.
   */
  const demoBlock = (
    <footer className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
      <b className="text-sm">{t('demoTitle', lang)}</b>
      <div className="flex flex-wrap gap-2">
        {DEMO_PLACE_IDS.map((id) => {
          const place = PLACE_BY_ID[id];
          if (!place) return null;
          return (
            <button key={id} className="chip" onClick={() => simulate(id)}>
              {tr(place.name, lang)}
            </button>
          );
        })}
      </div>
      {/*
        Честность формулировки важна не меньше самой кнопки: мы подставляем
        ВХОД (координату из того же датасета), а не ВЫХОД. Радиус, поиск
        ближайшего объекта и сборка брифинга отрабатывают по-настоящему.
      */}
      <p className="muted text-[12px]">
        {t('demoNote', lang)} ({AT_PLACE_LIMIT_M} {t('meters', lang)})
      </p>
    </footer>
  );

  return (
    <section className="card flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {found
              ? t('foundTitle', lang).replace('{name}', found.briefing.name)
              : t('title', lang)}
          </h2>
          <p className="muted prose-measure mt-1 text-[13px]">{t('lead', lang)}</p>
        </div>
        <button className="btn btn-primary" onClick={locate} disabled={phase.kind === 'locating'}>
          <Icon name="pin" size={18} />
          {phase.kind === 'locating' ? t('locating', lang) : t('enable', lang)}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {/* Слежение идёт — человек должен это видеть, а не догадываться:
            иначе непонятно, ждать карточку или всё-таки жать кнопку. */}
        {watching && <span className="tag tag-ok">{t('watching', lang)}</span>}
        {notify === 'granted' ? (
          <span className="tag tag-ok">{t('notifyReady', lang)}</span>
        ) : notify === 'denied' ? (
          <span className="tag">{t('notifyDenied', lang)}</span>
        ) : notify === 'unsupported' ? null : (
          <button className="btn" onClick={askNotify}>
            <Icon name="alert" size={16} />
            {t('notifyOn', lang)}
          </button>
        )}
        <span className="muted">{t('privacy', lang)}</span>
      </div>

      {watching && !found && <p className="muted text-[13px]">{t('watchNote', lang)}</p>}
      {phase.kind === 'denied' && <p className="muted text-[13px]">{t('denied', lang)}</p>}
      {phase.kind === 'unsupported' && (
        <p className="muted text-[13px]">{t('unsupported', lang)}</p>
      )}
      {phase.kind === 'empty' && <p className="muted text-[13px]">{t('empty', lang)}</p>}

      {!found && demoBlock}

      {found && (
        <article className="flex flex-col gap-3">
          {/* Свой блок с картинкой не нужен: PlacePhoto уже держит пропорции,
              подпись автора и размеры — пусть экран выглядит как остальные. */}
          <PlacePhoto
            placeId={found.briefing.place.id}
            alt={found.briefing.name}
            lang={lang}
            ratio={16 / 9}
            credit
            sizes="(max-width: 640px) 100vw, 640px"
          />

          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-xl font-bold">{found.briefing.name}</h3>
            <span className="tag">
              {found.meters} {t('meters', lang)}
            </span>
            <span className="tag">
              {t('visit', lang)}: {found.briefing.visitMinutes} {t('minutes', lang)}
            </span>
            {found.simulated && <span className="tag tag-warn">{t('simulated', lang)}</span>}
          </div>

          <p className="prose-measure text-[15px]">{found.briefing.summary}</p>

          {found.briefing.highlights.length > 0 && (
            <div className="flex flex-col gap-2">
              <b className="text-sm">{t('willSee', lang)}</b>
              <div className="flex flex-wrap gap-2">
                {found.briefing.highlights.map((item) => (
                  <span key={item} className="tag tag-accent">
                    {item}
                  </span>
                ))}
              </div>
              {/* Ради этой строки экран и сделан: турист узнаёт, что спросить. */}
              <p className="muted text-[13px]">{t('askGuide', lang)}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <b className="text-sm">{t('facts', lang)}</b>
            <ul className="flex flex-col gap-2">
              {found.briefing.facts.map((fact) => (
                <li key={fact.id} className="flex flex-col gap-1 border-s-2 ps-3" style={{ borderColor: 'var(--border-strong)' }}>
                  <span className="prose-measure text-[14px]">{fact.text}</span>
                  <span className="muted text-[12px]">
                    {tr(fact.source.title, lang)}
                    {fact.contested && ` · ${t('contested', lang)}`}
                  </span>
                </li>
              ))}
            </ul>
            {found.briefing.thin && <p className="muted text-[13px]">{t('thin', lang)}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={`/check?place=${found.briefing.place.id}`}>
              {t('checkCta', lang)}
            </Link>
            <Link className="btn" href={`/place/${found.briefing.place.id}`}>
              {t('moreCta', lang)}
            </Link>
          </div>
        </article>
      )}

      {found && demoBlock}
    </section>
  );
}
