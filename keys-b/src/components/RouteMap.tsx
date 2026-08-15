'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
// в maplibre-gl 6 нет default-экспорта — только именованные
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { t, tr } from '@/lib/i18n';
import { dayColor, type DayRoute } from '@/lib/route';
import type { Lang, Place } from '@/lib/types';

// Карта маршрута на MapLibre GL.
//
// Почему не Leaflet: растровые тайлы дают подписи, вшитые в картинку — их не
// перевести, не подкрасить под тему и они мылятся при зуме. Вектор рисуется
// на лету: плавный зум, чёткие подписи, один стиль на светлую и тёмную тему.
//
// Стиль по умолчанию — векторный OpenFreeMap: без ключа и регистрации,
// подписи рисуются на лету и потому читаются на любом зуме.
// Если он не поднимется, карта сама переключается на растровый OSM,
// описанный ниже: пустого прямоугольника на демо быть не должно.
// Заменить стиль можно переменной NEXT_PUBLIC_MAP_STYLE.

/**
 * MapLibre 6 разбирает векторные тайлы в отдельном Web Worker, который лежит
 * отдельным модулем. Сборщик его не выдаёт: воркер молча не стартует, и карта
 * не запрашивает ни тайлов, ни шрифтов — стиль грузится, а полотно остаётся
 * белым, причём без единой ошибки в консоли. Поэтому воркер и его общий чанк
 * лежат в статике, а адрес задаётся явно.
 * Растровому стилю воркер не нужен — на нём проблема и не проявлялась.
 */
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const VECTOR_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

const RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

/**
 * `label` — номер объекта ВНУТРИ своего дня, тот же, что стоит в таймлайне.
 *
 * Раньше маркер подписывался порядковым номером в общем списке точек, а список
 * дня — своим. Один и тот же объект оказывался «4» на карте и «1» в плане дня,
 * и турист, сверяя их глазами, видел два разных маршрута.
 */
export type RoutePoint = { place: Place; day: number; label: number };

/** Каждый день — отдельная линия своего цвета: маршрут читается без легенды. */
function toFeatures(routes: DayRoute[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: 'FeatureCollection',
    features: routes.map((route) => ({
      type: 'Feature',
      properties: { color: dayColor(route.day), direct: route.source === 'direct' },
      geometry: { type: 'LineString', coordinates: route.line },
    })),
  };
}

export default function RouteMap({
  points,
  routes,
  lang,
}: {
  points: RoutePoint[];
  routes: DayRoute[];
  lang: Lang;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  // Данные читаем через ref, а эффект держим на строковом ключе.
  // Иначе массив точек — новый объект на каждый рендер, эффект перезапускается,
  // карта успевает только создаться и тут же уничтожиться: маркеры не появляются.
  const data = useRef({ points, routes, lang });
  const key = `${points.map((p) => `${p.place.id}:${p.day}`).join(',')}|${lang}`;
  // геометрия приходит позже точек: сначала прямые, потом дороги
  const shapeKey = routes.map((r) => `${r.day}:${r.source}:${r.line.length}`).join(',');
  const redraw = useRef<() => void>(() => {});

  // ref обновляем в эффекте, а не во время рендера: рендер должен быть чистым
  useEffect(() => {
    data.current = { points, routes, lang };
  });

  useEffect(() => {
    if (!container.current) return;
    const { points, lang } = data.current;
    if (points.length === 0) return;
    let switched = false;

    const instance = new MapLibreMap({
      container: container.current,
      style: VECTOR_STYLE ?? RASTER_STYLE,
      center: [points[0].place.lng, points[0].place.lat],
      zoom: 12,
      // колесо мыши не перехватываем: страница длинная, и скролл важнее зума
      scrollZoom: false,
      attributionControl: { compact: true },
    });
    map.current = instance;

    // Стиль не поднялся — молча переходим на растр вместо пустого экрана.
    instance.on('error', (event) => {
      const message = String(event?.error?.message ?? '');
      if (switched) return;
      if (message.includes('style') || message.includes('Failed to fetch')) {
        switched = true;
        instance.setStyle(RASTER_STYLE);
      }
    });

    instance.addControl(new NavigationControl({ showCompass: false }), 'top-left');

    const draw = () => {
      const shape = toFeatures(data.current.routes);

      if (instance.getSource('route')) {
        (instance.getSource('route') as GeoJSONSource).setData(shape);
        return;
      }

      instance.addSource('route', { type: 'geojson', data: shape });
      // Белая подложка под линией: без неё маршрут теряется среди дорог,
      // которые на векторной карте тоже цветные.
      instance.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
      });
      instance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        filter: ['!', ['get', 'direct']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 4.5 },
      });
      // Прямая линия — не дорога, и выглядеть она должна иначе: пунктир
      // честно говорит «маршрутизатор недоступен, это направление, не путь».
      instance.addLayer({
        id: 'route-direct',
        type: 'line',
        source: 'route',
        filter: ['get', 'direct'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3.5,
          'line-dasharray': [1.5, 1.5],
        },
      });
    };

    // Маркеры ставим сразу, не дожидаясь события load: оно наступает только
    // когда догрузятся все ресурсы стиля, а на медленной сети это секунды —
    // и если стиль подведёт, точек не будет вовсе. Marker к стилю не привязан.
    {
      // маркеры — обычные DOM-элементы: их проще стилизовать и они видны
      // в дереве доступности, в отличие от нарисованных на canvas
      points.forEach((point) => {
        const el = document.createElement('div');
        el.className = 'map-pin';
        el.style.background = dayColor(point.day);
        // номер внутри дня — тот же, что в таймлайне; цвет уже говорит, какой это день
        el.textContent = String(point.label);
        el.title = `${point.label}. ${tr(point.place.name, lang)}`;

        new Marker({ element: el })
          .setLngLat([point.place.lng, point.place.lat])
          .setPopup(
            new Popup({ offset: 18, closeButton: false }).setText(
              `${point.label}. ${tr(point.place.name, lang)}`,
            ),
          )
          .addTo(instance);
      });

      if (points.length === 1) {
        instance.setCenter([points[0].place.lng, points[0].place.lat]);
        instance.setZoom(14);
      } else {
        const bounds = points.reduce(
          (b, p) => b.extend([p.place.lng, p.place.lat]),
          new LngLatBounds(
            [points[0].place.lng, points[0].place.lat],
            [points[0].place.lng, points[0].place.lat],
          ),
        );
        instance.fitBounds(bounds, { padding: 56, duration: 0 });
      }
    }

    // Линия — единственное, что требует разобранного стиля.
    // На isStyleLoaded() не опираемся: с внешним стилем он может не стать true
    // (доугружаются шрифты и спрайты), а слой добавляется и без них.
    // Поэтому пробуем на каждом styledata и глушим ошибку «стиль ещё не готов».
    const tryDraw = () => {
      try {
        draw();
        if (container.current) container.current.dataset.ready = '1';
      } catch {
        // стиль ещё не разобран — попробуем на следующем событии
      }
    };
    redraw.current = tryDraw;
    instance.on('styledata', tryDraw);
    instance.on('idle', tryDraw);
    tryDraw();

    return () => {
      redraw.current = () => {};
      instance.remove();
      map.current = null;
    };
    // перерисовываем только на смену состава маршрута или языка подписей
  }, [key]);

  // Дороги приходят с сети позже: обновляем линию, не пересоздавая карту.
  useEffect(() => {
    redraw.current();
  }, [shapeKey]);

  if (points.length === 0) return null;

  const days = [...new Set(points.map((p) => p.day))];
  const direct = routes.length > 0 && routes.every((r) => r.source === 'direct');

  return (
    <>
      {/*
        Скринридеру карта не говорит ничего: это WebGL-полотно. Рядом лежит
        текстовый эквивалент маршрута — не виден глазами, читается вслух
        и находится поиском по странице.
      */}
      <ol className="sr-only">
        {points.map((point) => (
          <li key={`${point.day}:${point.place.id}`}>
            {/* день называем словом: цвет маркера, различающий дни, скринридеру недоступен */}
            {t('planDay', lang)} {point.day} · {point.label}. {tr(point.place.name, lang)}
          </li>
        ))}
      </ol>

      <div aria-hidden="true">
        <div ref={container} className="route-map" />

        {/* Что означают цвета линий и точек. Один день — легенда не нужна. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          {days.length > 1 &&
            days.map((day) => (
              <span key={day} className="inline-flex items-center gap-1.5">
                <i className="legend-dot" style={{ background: dayColor(day) }} />
                {t('planDay', lang)} {day}
              </span>
            ))}
          <span className="muted">
            {t(direct ? 'routeDirectNote' : 'routeRoadsNote', lang)}
          </span>
        </div>
      </div>
    </>
  );
}
