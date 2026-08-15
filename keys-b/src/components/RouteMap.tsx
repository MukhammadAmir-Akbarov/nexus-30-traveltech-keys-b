'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
// в maplibre-gl 6 нет default-экспорта — только именованные
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { tr } from '@/lib/i18n';
import type { Lang, Place } from '@/lib/types';

// Карта маршрута на MapLibre GL.
//
// Почему не Leaflet: растровые тайлы дают подписи, вшитые в картинку — их не
// перевести, не подкрасить под тему и они мылятся при зуме. Вектор рисуется
// на лету: плавный зум, чёткие подписи, один стиль на светлую и тёмную тему.
//
// Источник тайлов по умолчанию — растровый OSM, описанный прямо здесь.
// Векторный OpenFreeMap красивее (подписи рисуются на лету, плавный зум), но
// на нашей сети он отдаёт стиль и спрайты, а полотно остаётся белым — проверено.
// Пустая карта на защите хуже простой, поэтому вектор включается явно:
// NEXT_PUBLIC_MAP_STYLE=<url стиля>. Растр вдобавок уже кэшируется
// сервис-воркером, то есть работает офлайн.

const VECTOR_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE;

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

/** Цвета дней: маршрут читается с одного взгляда, без легенды. */
const DAY_COLORS = ['#0d7a75', '#c2610a', '#5b53c4', '#a3123f', '#2f7d1f', '#8a6d00', '#0f6ea8'];

export type RoutePoint = { place: Place; day: number };

export default function RouteMap({ points, lang }: { points: RoutePoint[]; lang: Lang }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  // Данные читаем через ref, а эффект держим на строковом ключе.
  // Иначе массив точек — новый объект на каждый рендер, эффект перезапускается,
  // карта успевает только создаться и тут же уничтожиться: маркеры не появляются.
  const data = useRef({ points, lang });
  data.current = { points, lang };
  const key = `${points.map((p) => `${p.place.id}:${p.day}`).join(',')}|${lang}`;

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
      // линия маршрута отдельным слоем под маркерами
      const line: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points.map((p) => [p.place.lng, p.place.lat]),
        },
      };

      if (instance.getSource('route')) {
        (instance.getSource('route') as GeoJSONSource).setData(line);
      } else {
        instance.addSource('route', { type: 'geojson', data: line });
        instance.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0d7a75', 'line-width': 3, 'line-opacity': 0.75 },
        });
      }
    };

    // Маркеры ставим сразу, не дожидаясь события load: оно наступает только
    // когда догрузятся все ресурсы стиля, а на медленной сети это секунды —
    // и если стиль подведёт, точек не будет вовсе. Marker к стилю не привязан.
    {
      // маркеры — обычные DOM-элементы: их проще стилизовать и они видны
      // в дереве доступности, в отличие от нарисованных на canvas
      points.forEach((point, index) => {
        const el = document.createElement('div');
        el.className = 'map-pin';
        el.style.background = DAY_COLORS[(point.day - 1) % DAY_COLORS.length];
        el.textContent = String(index + 1);
        el.title = `${index + 1}. ${tr(point.place.name, lang)}`;

        new Marker({ element: el })
          .setLngLat([point.place.lng, point.place.lat])
          .setPopup(
            new Popup({ offset: 18, closeButton: false }).setText(
              `${index + 1}. ${tr(point.place.name, lang)}`,
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
      if (instance.getSource('route')) return;
      try {
        draw();
        if (container.current) container.current.dataset.ready = '1';
      } catch {
        // стиль ещё не разобран — попробуем на следующем событии
      }
    };
    instance.on('styledata', tryDraw);
    instance.on('idle', tryDraw);
    tryDraw();

    return () => {
      instance.remove();
      map.current = null;
    };
    // перерисовываем только на смену состава маршрута или языка подписей
  }, [key]);

  if (points.length === 0) return null;

  return (
    <>
      {/*
        Скринридеру карта не говорит ничего: это WebGL-полотно. Рядом лежит
        текстовый эквивалент маршрута — не виден глазами, читается вслух
        и находится поиском по странице.
      */}
      <ol className="sr-only">
        {points.map((point, index) => (
          <li key={point.place.id}>
            {index + 1}. {tr(point.place.name, lang)}
          </li>
        ))}
      </ol>

      <div aria-hidden="true">
        <div ref={container} className="route-map" />
      </div>
    </>
  );
}
