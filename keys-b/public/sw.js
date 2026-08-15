// Сервис-воркер прототипа: приложение должно открываться в поездке,
// где интернета может не быть (ТЗ §3 — «sayohat davomida»).
//
// Стратегия простая и предсказуемая:
//  - страницы и статика: сначала сеть, при отказе — кэш;
//  - ответы /api/plan и /api/check: кэшируем последний удачный ответ и отдаём
//    его, если сети нет. Так последний маршрут и последняя проверка остаются
//    под рукой офлайн.
// ponytail: без Workbox — здесь тридцать строк, библиотека не окупается.

const CACHE = 'hamroh-v2';
const APP_SHELL = [
  '/',
  '/plan',
  '/check',
  '/guides',
  '/manifest.webmanifest',
  '/icon.svg',
  // воркер карты и его общий чанк: без них векторная карта не рисуется вовсе
  '/maplibre/maplibre-gl-worker.mjs',
  '/maplibre/maplibre-gl-shared.mjs',
];

// Тайлы карты живут отдельно: их много, они не меняются и переживают
// обновление приложения. Без этого офлайн-режим врал: интерфейс открывался,
// а карта маршрута оставалась серым прямоугольником.
const TILE_CACHE = 'hamroh-tiles-v1';
const TILE_HOSTS = [
  // векторный источник по умолчанию
  'tiles.openfreemap.org',
  // маршрутизатор: один и тот же маршрут запрашивается тем же адресом,
  // поэтому кэш-первым он и работает офлайн, и не ходит в сеть повторно
  'router.project-osrm.org',
  // растровый запасной
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
];
/** Потолок, чтобы кэш не рос бесконечно: примерно два города на всех зумах. */
const TILE_LIMIT = 900;

async function cacheTile(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // тайлы отдаются с CORS, но даже opaque-ответ годится: его можно вернуть как есть
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    if (keys.length > TILE_LIMIT) await cache.delete(keys[0]);
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // тайлы карты: сначала кэш, потом сеть — один раз посмотрел онлайн,
  // дальше карта открывается и без сети
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheTile(request).catch(() => Response.error()));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const isApi = url.pathname.startsWith('/api/');
  if (isApi && request.method !== 'POST') return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // ключ для POST-запросов строим из пути и тела: у маршрута и проверки
      // ответ зависит от параметров
      const key = isApi ? `${url.pathname}:${await request.clone().text()}` : request;

      try {
        const response = await fetch(request);
        if (response.ok) cache.put(key, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(key);
        if (cached) return cached;
        if (!isApi) {
          const shell = await cache.match('/');
          if (shell) return shell;
        }
        throw error;
      }
    })(),
  );
});
