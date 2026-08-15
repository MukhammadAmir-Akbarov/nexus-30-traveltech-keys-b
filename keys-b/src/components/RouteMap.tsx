'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { tr } from '@/lib/i18n';
import type { Lang, Place } from '@/lib/types';

// Маркеры — CircleMarker, а не Marker: не нужны PNG-иконки Leaflet,
// которые ломаются при сборке бандлером.

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export default function RouteMap({ places, lang }: { places: Place[]; lang: Lang }) {
  if (places.length === 0) return null;
  const points = places.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <>
      {/*
        Скринридеру карта не говорит ничего: Leaflet рисует тайлы и svg-круги.
        Поэтому рядом лежит текстовый эквивалент того же маршрута — он не виден
        глазами, но читается вслух и находится поиском по странице.
      */}
      <ol className="sr-only">
        {places.map((place, index) => (
          <li key={place.id}>
            {index + 1}. {tr(place.name, lang)}
          </li>
        ))}
      </ol>

      {/* aria-hidden вешаем на обёртку: MapContainer чужие атрибуты не пробрасывает.
          Карта — вспомогательная картинка, порядок объектов уже прочитан выше. */}
      <div aria-hidden="true">
      <MapContainer center={points[0]} zoom={13} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} pathOptions={{ color: '#2fb8ad', weight: 3, opacity: 0.8 }} />
      {places.map((place, index) => (
        <CircleMarker
          key={place.id}
          center={[place.lat, place.lng]}
          radius={11}
          pathOptions={{ color: '#0d7a75', fillColor: '#2fb8ad', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {index + 1}. {tr(place.name, lang)}
          </Tooltip>
        </CircleMarker>
      ))}
        <FitBounds points={points} />
      </MapContainer>
      </div>
    </>
  );
}
