// Сервис-воркер прототипа: приложение должно открываться в поездке,
// где интернета может не быть (ТЗ §3 — «sayohat davomida»).
//
// Стратегия простая и предсказуемая:
//  - страницы и статика: сначала сеть, при отказе — кэш;
//  - ответы /api/plan и /api/check: кэшируем последний удачный ответ и отдаём
//    его, если сети нет. Так последний маршрут и последняя проверка остаются
//    под рукой офлайн.
// ponytail: без Workbox — здесь тридцать строк, библиотека не окупается.

const CACHE = 'hamroh-v1';
const APP_SHELL = ['/', '/plan', '/check', '/guides', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // тайлы карты и прочее не трогаем

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
