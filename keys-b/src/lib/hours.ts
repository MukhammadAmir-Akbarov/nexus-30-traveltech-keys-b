/**
 * Часы работы объекта: открыт ли он прямо сейчас.
 *
 * Поля `opens` и `closes` лежали в данных с самого начала и работали в одном
 * месте — планировщик ставил метку «закрыт» на объекте маршрута. На карточке
 * объекта и в каталоге их не было вовсе: турист, стоящий у входа с телефоном,
 * видел всё, кроме того, что ему нужно в эту минуту.
 *
 * Время считаем по Ташкенту, а не по часам телефона: у приехавшего из Стамбула
 * они показывают на два часа меньше, и «открыто» превратилось бы во «врёт».
 * Летнего перевода в Узбекистане нет, поэтому смещение постоянное — UTC+5.
 */

export const TASHKENT_UTC_OFFSET_MINUTES = 5 * 60;

/** Минуты от полуночи по Ташкенту. */
export function tashkentMinutes(now: Date = new Date()): number {
  const shifted = now.getTime() + TASHKENT_UTC_OFFSET_MINUTES * 60_000;
  const utc = new Date(shifted);
  return utc.getUTCHours() * 60 + utc.getUTCMinutes();
}

/** «09:00» из минут от полуночи. */
export function clockLabel(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export type OpeningHours = { opens?: number; closes?: number };

/**
 * Открыт ли объект в это время.
 *
 * `null` — у объекта нет часов работы: площадь Регистан снаружи и мавзолей
 * под открытым небом доступны в любое время, и писать им «закрыто» в 22:00
 * значит соврать. Отсутствие данных и закрытая дверь — разные вещи.
 */
export function isOpenAt(place: OpeningHours, minutes: number): boolean | null {
  if (place.closes === undefined && place.opens === undefined) return null;
  const from = place.opens ?? 0;
  const to = place.closes ?? 24 * 60;
  return minutes >= from && minutes < to;
}

/** «09:00 – 19:00» для карточки объекта. Нет часов — нечего и печатать. */
export function hoursLine(place: OpeningHours): string | null {
  if (place.closes === undefined && place.opens === undefined) return null;
  return `${clockLabel(place.opens ?? 0)} – ${clockLabel(place.closes ?? 24 * 60)}`;
}

/**
 * Сколько минут осталось до закрытия. Отрицательное — уже закрыто,
 * `null` — часов работы нет. Нужно для предупреждения «закрывается через 40 мин»:
 * успеть за час до закрытия в Шахи-Зинда нельзя, и лучше сказать заранее.
 */
export function minutesUntilClose(place: OpeningHours, minutes: number): number | null {
  if (place.closes === undefined) return null;
  return place.closes - minutes;
}

/** Скоро закроется: осмотр не влезает в остаток дня. */
export function closingSoon(place: OpeningHours & { visitMinutes?: number }, minutes: number): boolean {
  const left = minutesUntilClose(place, minutes);
  if (left === null || left <= 0) return false;
  return left < (place.visitMinutes ?? 60);
}
