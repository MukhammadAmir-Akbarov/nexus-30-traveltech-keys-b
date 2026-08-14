import type { Region, Transfer, TransferOption } from './types.ts';

// Переезды между городами (§4.2 ТЗ: «Shaxsiylashtirilgan transfer va AI trip-planner»).
// Скоростной поезд ходит не везде, поэтому железная дорога задана таблицей известных
// направлений, а машина и микроавтобус считаются от расстояния по трассе.
//
// Цены — ОРИЕНТИРОВОЧНАЯ демо-оценка на человека, не тариф перевозчика.
// В рабочей версии сюда подключается расписание и прайс партнёра.

const ROAD_SPEED_KMH = 65;
const CAR_USD_PER_KM = 0.3;
const MINIBUS_USD_PER_KM = 0.12;

type TrainLeg = { hours: number; priceUsd: number };

/** Направления, где есть пассажирский поезд. Направление роли не играет. */
const TRAIN_LEGS: [Region, Region, TrainLeg][] = [
  ['tashkent', 'samarkand', { hours: 2, priceUsd: 18 }],
  ['samarkand', 'bukhara', { hours: 1.5, priceUsd: 12 }],
  ['tashkent', 'bukhara', { hours: 3.5, priceUsd: 25 }],
  ['tashkent', 'khiva', { hours: 14, priceUsd: 30 }],
  ['samarkand', 'shakhrisabz', { hours: 1.5, priceUsd: 10 }],
];

function key(a: Region, b: Region): string {
  return [a, b].sort().join('|');
}

// ключи нормализуем один раз здесь, иначе достаточно написать пару в обратном
// порядке — и направление молча перестаёт находиться
const TRAIN: Record<string, TrainLeg> = Object.fromEntries(
  TRAIN_LEGS.map(([from, to, leg]) => [key(from, to), leg]),
);

export function trainLeg(from: Region, to: Region): TrainLeg | null {
  return TRAIN[key(from, to)] ?? null;
}

export function buildTransfer(
  fromRegion: Region,
  toRegion: Region,
  straightLineKm: number,
): Transfer {
  const km = Math.round(straightLineKm * 1.25); // дорога длиннее прямой линии
  const roadHours = Math.max(1, Math.round(km / ROAD_SPEED_KMH));

  const options: TransferOption[] = [
    { mode: 'car', hours: roadHours, priceUsd: Math.round(km * CAR_USD_PER_KM) },
    { mode: 'minibus', hours: roadHours + 1, priceUsd: Math.max(3, Math.round(km * MINIBUS_USD_PER_KM)) },
  ];

  const train = trainLeg(fromRegion, toRegion);
  if (train) options.unshift({ mode: 'train', hours: train.hours, priceUsd: train.priceUsd });

  return {
    fromRegion,
    toRegion,
    km,
    // самый быстрый вариант первым: именно его планировщик закладывает в день
    options: options.sort((a, b) => a.hours - b.hours),
  };
}

/** Время, которое переезд съедает у дня осмотра. */
export function transferHours(transfer: Transfer): number {
  return transfer.options[0].hours;
}
