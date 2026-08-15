import { REGION_CENTER } from '../data/climate.ts';
import type { Region } from './types.ts';

/**
 * Время намаза по маршруту.
 *
 * Зиёрат-туризм — огромный сегмент в Узбекистане, и для него важно не только
 * «где намазхона» (это уже есть в POI), но и «когда». Пять минут расчёта убирают
 * ситуацию, в которой маршрут ставит осмотр ровно на время молитвы.
 *
 * Считаем по солнцу, без сети и без сторонних API: нужны только координаты,
 * дата и угол. Точность — минуты; для планирования дня этого достаточно,
 * и в интерфейсе прямо сказано, что это расчёт, а не расписание мечети.
 */

export type Prayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/** Углы погружения солнца под горизонт для утренней и вечерней молитвы. */
const FAJR_ANGLE = 18;
const ISHA_ANGLE = 17;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

/** Склонение солнца и уравнение времени — стандартные приближения. */
function sunPosition(date: Date) {
  const n = dayOfYear(date);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  return { declination, equationOfTime };
}

function clock(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Время пяти намазов для региона на дату. Часовой пояс Узбекистана — UTC+5,
 * летнего перевода нет, поэтому смещение постоянное.
 */
export function prayerTimes(region: Region, date: string): Record<Prayer, string> {
  const { lat, lng } = REGION_CENTER[region];
  const when = new Date(`${date}T12:00:00Z`);
  const { declination, equationOfTime } = sunPosition(when);

  const TZ_MINUTES = 5 * 60;
  // солнечный полдень в местном времени
  const noon = 720 - 4 * lng - equationOfTime + TZ_MINUTES;

  /** Часовой угол для заданной высоты солнца, в минутах от полудня. */
  const hourAngle = (altitude: number): number | null => {
    const cosH =
      (Math.sin(rad(altitude)) - Math.sin(rad(lat)) * Math.sin(declination)) /
      (Math.cos(rad(lat)) * Math.cos(declination));
    // полярные широты сюда не попадают, но деление всё равно защищаем
    if (cosH < -1 || cosH > 1) return null;
    return 4 * deg(Math.acos(cosH));
  };

  const sunrise = hourAngle(-0.833);
  const fajr = hourAngle(-FAJR_ANGLE);
  const isha = hourAngle(-ISHA_ANGLE);

  // аср по ханафитскому расчёту: тень равна двум длинам предмета
  const asrAltitude = deg(Math.atan(1 / (2 + Math.tan(Math.abs(rad(lat) - declination)))));
  const asr = hourAngle(asrAltitude);

  return {
    fajr: clock(noon - (fajr ?? sunrise ?? 90) - 0),
    dhuhr: clock(noon + 4),
    asr: clock(noon + (asr ?? 180)),
    maghrib: clock(noon + (sunrise ?? 90)),
    isha: clock(noon + (isha ?? sunrise ?? 90)),
  };
}

/**
 * Восход, закат и золотой час.
 *
 * Считается тем же солнцем, что и намаз, — сеть не нужна. Нужно это тем, кто
 * выбрал интерес «фото»: Регистан в полдень и Регистан за полчаса до заката —
 * это два разных снимка, и знать об этом надо до, а не после поездки.
 */
export function sunTimes(
  region: Region,
  date: string,
): { sunrise: string; sunset: string; goldenMorning: string; goldenEvening: string } {
  const { lat, lng } = REGION_CENTER[region];
  const when = new Date(`${date}T12:00:00Z`);
  const { declination, equationOfTime } = sunPosition(when);
  const noon = 720 - 4 * lng - equationOfTime + 5 * 60;

  const cosH =
    (Math.sin(rad(-0.833)) - Math.sin(rad(lat)) * Math.sin(declination)) /
    (Math.cos(rad(lat)) * Math.cos(declination));
  // на широтах Узбекистана солнце восходит всегда; защита — от деления, не от полярной ночи
  const half = cosH < -1 || cosH > 1 ? 360 : 4 * deg(Math.acos(cosH));

  return {
    sunrise: clock(noon - half),
    sunset: clock(noon + half),
    // золотой час: первый час после восхода и последний перед закатом
    goldenMorning: clock(noon - half + 60),
    goldenEvening: clock(noon + half - 60),
  };
}

/** Намазы, которые попадают внутрь осмотра объекта, — их и показываем в дне. */
export function prayersDuring(
  times: Record<Prayer, string>,
  fromClock: string,
  minutes: number,
): Prayer[] {
  const toMinutes = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMinutes(fromClock);
  const end = start + minutes;
  return (Object.keys(times) as Prayer[]).filter((prayer) => {
    const at = toMinutes(times[prayer]);
    return at >= start && at <= end;
  });
}
