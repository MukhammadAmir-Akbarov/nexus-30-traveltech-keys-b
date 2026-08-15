// Единый набор иконок вместо эмодзи: эмодзи выглядят по-разному в каждой ОС
// и ломают ровную типографику. Контуры в стиле Lucide, сетка 24×24.

const PATHS: Record<string, string> = {
  plane: 'M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-1 1.6l4.7 3.5-2 2H4l-1 1 3 1 1 3 1-1v-2.5l2-2 3.5 4.7a1 1 0 0 0 1.6-1z',
  train: 'M4 15.5V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3ZM4 11h16M8 19l-2 3M16 19l2 3M8.5 15h.01M15.5 15h.01',
  bus: 'M4 16V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10M4 11h16M6 19v2M18 19v2M4 16h16v3H4zM7.5 15h.01M16.5 15h.01',
  car: 'M5 17h14M6.5 17a1.5 1.5 0 1 0 0 .01M17.5 17a1.5 1.5 0 1 0 0 .01M3 13.5 4.6 8a2 2 0 0 1 1.9-1.4h11a2 2 0 0 1 1.9 1.4L21 13.5V17H3z',
  minibus: 'M3 16V8a2 2 0 0 1 2-2h11l5 5v5M3 12h18M7.5 19a1.5 1.5 0 1 0 0 .01M17.5 19a1.5 1.5 0 1 0 0 .01M3 16h18',
  fuel: 'M3 21h10M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M4 11h9M16 7l3 3v8a2 2 0 0 1-4 0v-3',
  walk: 'M13 3.5a1.5 1.5 0 1 0 0 .01M12 8l-3 2 1 4-3 7M12 8l3 1.5 1 3.5 3 1M10 14l3.5 1.5L15 21',
  toilet: 'M7 3v6M4 6h6M6 12h4l-1 9H7zM17 3a2 2 0 1 1 0 .01M14 21l1-7h-1l1.5-4h1L19 14h-1l1 7z',
  mosque: 'M12 2c2 2.5 3 4 3 5.5H9C9 6 10 4.5 12 2ZM5 21V11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10M3 21h18M10 21v-4a2 2 0 1 1 4 0v4',
  clinic: 'M12 7v10M7 12h10M4 21V6.5a2 2 0 0 1 1.2-1.8l6-2.6a2 2 0 0 1 1.6 0l6 2.6A2 2 0 0 1 20 6.5V21M3 21h18',
  cafe: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M4 21h13',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
  stop: 'M7 7h10v10H7z',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  volume: 'M4 9v6h4l5 4V5L8 9zM17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M12 15V3M8 7l4-4 4 4',
  sun: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z',
  check: 'M4 12.5 9 18 20 6',
  close: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 8v5M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18ZM12 7v5l3 2',
  external: 'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
  route: 'M6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM18 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-4-4',
  user: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 21a8 8 0 0 1 16 0',
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none' }}
    >
      <path d={d} />
    </svg>
  );
}
