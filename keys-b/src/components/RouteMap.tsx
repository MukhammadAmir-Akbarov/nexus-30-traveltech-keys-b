'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { Place } from '@/lib/types';

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

export default function RouteMap({ places }: { places: Place[] }) {
  if (places.length === 0) return null;
  const points = places.map((p) => [p.lat, p.lng] as [number, number]);

  return (
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
            {index + 1}. {place.name}
          </Tooltip>
        </CircleMarker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
