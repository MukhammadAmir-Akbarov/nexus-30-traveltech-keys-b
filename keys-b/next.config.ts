import type { NextConfig } from 'next';

/**
 * Заголовки безопасности.
 *
 * Продукт делается для государственного заказчика и будет жить на публичном
 * адресе: без этих четырёх строк страницу можно встроить в чужой фрейм и
 * показать поверх неё что угодно, а внешний сайт увидит в реферере полный
 * путь — включая адрес заявки с кодом. Ничего из этого приложению не нужно.
 *
 * CSP здесь намеренно нет: карта тянет тайлы и шрифты с нескольких доменов,
 * маршрут — OSRM, погода — Open-Meteo, и политика, написанная наспех, ломает
 * карту молча. Это отдельная работа с проверкой каждого источника.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // геолокация нужна карте, остальное приложение не запрашивает никогда
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), payment=()' },
];

const nextConfig: NextConfig = {
  // иначе Turbopack поднимается до package-lock.json в домашней папке
  turbopack: { root: __dirname },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
