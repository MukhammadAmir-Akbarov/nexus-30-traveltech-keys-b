import type { Itinerary, Lang, Place } from './types.ts';

// Экспорт маршрута в календарь. Турист живёт в календаре телефона, а не в
// приложении, которое он открыл один раз; .ics открывается всем, что есть
// на любом устройстве, и не требует ни аккаунта, ни сети.
// ponytail: формат простой и стабильный — библиотека здесь не окупается.

/** Экранирование по RFC 5545: запятая, точка с запятой и перевод строки. */
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
}

/** Локальное время без зоны: календарь покажет его как есть, что нам и нужно. */
function stamp(date: Date, minutes: number): string {
  const d = new Date(date);
  d.setHours(0, minutes, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function minutesOf(at: string | undefined): number {
  if (!at) return 9 * 60;
  const [h, m] = at.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Одно событие на объект. Дата берётся из начала поездки; без неё — от завтра,
 * чтобы файл всё равно был осмысленным.
 */
export function itineraryToIcs(
  itinerary: Itinerary,
  places: Map<string, Place>,
  lang: Lang,
  startDate?: string,
): string {
  const start = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NEXUS30//TurizmHamroh//RU',
    'CALSCALE:GREGORIAN',
  ];

  for (const day of itinerary.days) {
    const date = new Date(start);
    date.setDate(start.getDate() + day.day - 1);

    for (const item of day.items) {
      const place = places.get(item.placeId);
      if (!place) continue;
      const from = minutesOf(item.at);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${place.id}-${day.day}@nexus30`,
        `DTSTART:${stamp(date, from)}`,
        `DTEND:${stamp(date, from + place.visitMinutes)}`,
        `SUMMARY:${esc(place.name[lang])}`,
        `DESCRIPTION:${esc(item.note)}`,
        `GEO:${place.lat};${place.lng}`,
        'END:VEVENT',
      );
    }
  }

  lines.push('END:VCALENDAR');
  // RFC требует CRLF — без него часть календарей файл не примет
  return lines.join('\r\n');
}
