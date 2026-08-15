import type {
  DayWeather,
  I18nText,
  Itinerary,
  ItineraryDay,
  ItineraryItem,
  Lang,
  Place,
  Region,
  Transfer,
  TripContext,
  TripCost,
} from './types.ts';
import { buildTransfer, transferHours } from './transfer.ts';
import { TRAVEL_TYPE_LABEL } from './i18n.ts';
import { adviceFor } from './weather.ts';
import { seasonBudgetFactor, seasonNote } from './calendar.ts';
import { tripDates } from './weather.ts';

// Правило-основанный планировщик. Работает без сети — это одновременно
// и запасной путь, если LLM недоступен на демо.
//
// Два правила, взятые из отзыва на прототип:
// 1) объекты одного города группируются в день по бюджету времени, а не размазываются
//    по одному на день;
// 2) при выборе «весь Узбекистан» маршрут идёт Ташкент → города → Ташкент,
//    переезд между городами занимает часть дня.

const MINUTES_PER_DAY = 330; // ~5.5 часов осмотра, остальное — дорога и еда

/**
 * Темп поездки. Одному нужен музей и чайхана, другому — восемь объектов за день;
 * это отдельная ось персонализации, которой не было: раньше все получали 330 минут.
 */
const PACE_MINUTES: Record<NonNullable<TripContext['pace']>, number> = {
  relaxed: 240,
  normal: MINUTES_PER_DAY,
  packed: 420,
};

/**
 * Бюджет осмотра на день: темп поездки плюс поправка на праздник.
 * В Навруз и Ураза-байрам учреждения работают короче — это меняет не порядок
 * объектов, а сколько их влезает, поэтому поправка применяется здесь,
 * при наборе дня, а не потом вместе с погодой.
 *
 * `dayIndex` — порядковый номер дня от нуля; дата берётся из начала поездки.
 */
function dayBudget(ctx: TripContext, dayIndex = 0): number {
  const base = PACE_MINUTES[ctx.pace ?? 'normal'];
  if (!ctx.startDate) return base;
  const date = tripDates(dayIndex + 1, ctx.startDate)[dayIndex];
  return Math.round(base * seasonBudgetFactor(date));
}
/** Начало осмотра. Позже жары и раньше закрытия музеев — обычный туристический день. */
const DAY_START = 9 * 60;
/** Переход между объектами внутри города. */
const HOP_MINUTES = 30;

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
/** Точка входа в страну: сюда прилетают и отсюда улетают. */
const ENTRY_REGION: Region = 'tashkent';

const TEXT = {
  family: {
    uz: 'Bolalar bilan sayohatga mos.',
    ru: 'Подходит для поездки с детьми.',
    en: 'Works well for a trip with children.',
  },
  matches: {
    uz: 'Qiziqishlaringizga mos keladi.',
    ru: 'Совпадает с вашими интересами.',
    en: 'Matches your interests.',
  },
  summerOutdoor: {
    uz: 'Yozda kunduzi +38 dan oshadi — bu obyektni tongda yoki kechqurun ko‘ring.',
    ru: 'Летом днём выше +38 — этот объект лучше смотреть утром или вечером.',
    en: 'Summer days exceed +38 °C — visit this open-air site in the morning or evening.',
  },
  // Причина перестановки всегда называется вслух: без объяснения учёт погоды
  // не виден и не проверяем — выглядит как случайный порядок.
  weatherHeat: {
    uz: 'Kunduzi +{t} — ochiq havodagi obyektlar tongga ko‘chirildi.',
    ru: 'Днём +{t} — объекты под открытым небом перенесены на утро.',
    en: '+{t} °C at midday — open-air sites moved to the morning.',
  },
  weatherRain: {
    uz: 'Yomg‘ir ({mm} mm) — kun yopiq obyektlardan yig‘ildi.',
    ru: 'Дождь ({mm} мм) — день собран из крытых объектов.',
    en: 'Rain ({mm} mm) — the day is built from indoor sites.',
  },
  weatherShortDay: {
    uz: 'Kun qisqa (+{t}) — ko‘rish vaqti qisqartirildi.',
    ru: 'Короткий световой день (+{t}) — время осмотра урезано.',
    en: 'Short daylight (+{t} °C) — sightseeing time is trimmed.',
  },
  more: { uz: 'yana', ru: 'ещё', en: 'plus' },
  empty: {
    uz: 'Tanlangan filtrlarga mos obyekt topilmadi — qiziqishlar sonini kamaytiring.',
    ru: 'Под выбранные фильтры объектов не нашлось — снимите часть интересов.',
    en: 'No places match the selected filters — remove some interests.',
  },
  summaryOneCity: {
    uz: '{days} kunlik marshrut: {n} ta obyekt, «{type}» formatiga moslangan.',
    ru: 'Маршрут на {days} дн.: {n} объектов, подобранных под формат «{type}».',
    en: 'A {days}-day itinerary: {n} places selected for the “{type}” format.',
  },
  // Выбрано несколько регионов: это ещё не «по стране» и старт не обязательно в Ташкенте.
  summaryCities: {
    uz: '{days} kunlik marshrut — shaharlar: {cities}, obyektlar: {n}. Boshlanish: {start}.',
    ru: 'Маршрут на {days} дн. — городов: {cities}, объектов: {n}. Старт: {start}.',
    en: 'A {days}-day itinerary — cities: {cities}, places: {n}. Starts in {start}.',
  },
  summaryMultiCity: {
    uz: 'Mamlakat bo‘ylab {days} kunlik marshrut — shaharlar: {cities}, obyektlar: {n}. Boshlanish: {start}.',
    ru: 'Маршрут по стране на {days} дн. — городов: {cities}, объектов: {n}. Старт: {start}.',
    en: 'A {days}-day countrywide itinerary — cities: {cities}, places: {n}. Starts in {start}.',
  },
  // Молча отдать 2 дня вместо запрошенных 5 нельзя: человек решит, что система сломалась
  shortened: {
    uz: ' So‘ralgan {asked} kundan qisqa: tanlangan filtrlarga mos obyektlar shuncha kunga yetdi.',
    ru: ' Это короче запрошенных {asked} дн.: объектов под выбранные фильтры хватило на столько.',
    en: ' Shorter than the {asked} days requested: the places matching your filters fill only these.',
  },
} satisfies Record<string, I18nText>;

const REGION_NAME: Record<Region, I18nText> = {
  samarkand: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
  bukhara: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
  khiva: { uz: 'Xiva', ru: 'Хива', en: 'Khiva' },
  tashkent: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
  shakhrisabz: { uz: 'Shahrisabz', ru: 'Шахрисабз', en: 'Shakhrisabz' },
  nurata: { uz: 'Nurota', ru: 'Нурата', en: 'Nurata' },
};

type Point = { lat: number; lng: number };

function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function centroid(places: Place[]): Point {
  const lat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const lng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  return { lat, lng };
}

export function scorePlace(place: Place, ctx: TripContext): number {
  let score = place.interests.filter((i) => ctx.interests.includes(i)).length * 2;
  if (selectedRegions(ctx).includes(place.region)) score += 3;
  if (ctx.travelType === 'family' && place.familyFriendly) score += 1;
  if (ctx.travelType === 'group' && place.visitMinutes <= 60) score += 0.5;
  if (ctx.travelType === 'solo' && place.interests.includes('photo')) score += 0.5;
  // Пара: виды и неспешность. Ограничителя по детям, как у семьи, здесь нет —
  // поэтому это не «семья на двоих», а отдельный профиль.
  if (ctx.travelType === 'couple') {
    if (place.interests.includes('photo')) score += 0.5;
    if (place.outdoor) score += 0.5;
  }
  return score;
}

/** Сортировка внутри дня: ближайший сосед от самого важного объекта. */
function orderByProximity(places: Place[]): Place[] {
  if (places.length <= 2) return places;
  const rest = places.slice(1);
  const ordered = [places[0]];
  while (rest.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (haversineKm(last, rest[i]) < haversineKm(last, rest[best])) best = i;
    }
    ordered.push(rest.splice(best, 1)[0]);
  }
  return ordered;
}

/**
 * `withInterestReason` — показывать ли «совпадает с вашими интересами».
 * Эта фраза верна почти для каждого отобранного объекта, и шесть повторов подряд
 * читаются как шум, поэтому она ставится один раз на день.
 */
function noteFor(
  place: Place,
  ctx: TripContext,
  lang: Lang,
  withInterestReason: boolean,
): string {
  const summary = place.summary[lang];
  // летом жара делает дневной осмотр под открытым небом тяжёлым (см. корпус, c34)
  if (ctx.summer && place.outdoor) return `${summary} ${TEXT.summerOutdoor[lang]}`;
  if (ctx.travelType === 'family' && place.familyFriendly) {
    return `${summary} ${TEXT.family[lang]}`;
  }
  if (withInterestReason && place.interests.some((i) => ctx.interests.includes(i))) {
    return `${summary} ${TEXT.matches[lang]}`;
  }
  return summary;
}

/** Выбранные регионы: пустой список означает всю страну. */
export function selectedRegions(ctx: TripContext): Region[] {
  if (ctx.regions?.length) return ctx.regions;
  return ctx.region && ctx.region !== 'all' ? [ctx.region] : [];
}

/**
 * Пул объектов для маршрута, разложенный на два эшелона.
 *
 * ПОЧЕМУ ДВА, А НЕ ОДИН ОТФИЛЬТРОВАННЫЙ СПИСОК. Раньше здесь стоял
 * `.filter(p => p.score > 0)`, а scorePlace() даёт +3 за попадание в выбранный
 * регион. То есть стоило туристу выбрать Самарканд — и любой самаркандский
 * объект получал score >= 3 и проходил фильтр. Интересы влияли только на
 * ПОРЯДОК, а состав оставался одинаковым: «ziyorat», «tabiat» и «taom» давали
 * ровно те же семь объектов, переставленные местами. Персонализация была
 * заявлена, но не работала.
 *
 * Жёстко выбрасывать несовпадающие объекты тоже нельзя: турист, выбравший
 * только «еду», получил бы на три дня в Самарканде один базар и пустые дни.
 * Поэтому совпавшие по интересам идут ПЕРВЫМ эшелоном, остальные — вторым,
 * и fillDay() добирает из второго только тогда, когда в дне ещё остался
 * бюджет времени. Состав меняется, дыр в маршруте не возникает.
 */
function eligible(places: Place[], ctx: TripContext): Place[] {
  const regions = selectedRegions(ctx);
  const excluded = new Set(ctx.excluded ?? []);
  const pinned = new Set(ctx.pinned ?? []);
  const wanted = new Set(ctx.interests ?? []);

  const scored = places
    // Регион не выбран — берём всю страну. Закреплённый вручную объект проходит
    // и мимо регионального фильтра: раньше он молча исчезал, если турист сначала
    // приколол объект, а потом сузил выбор до другого города, — и человек видел
    // план без того единственного места, ради которого всё затевал.
    .filter((p) => regions.length === 0 || regions.includes(p.region) || pinned.has(p.id))
    // турист убрал объект руками — уважаем, даже если он идеально подходит
    .filter((p) => !excluded.has(p.id))
    // формат «семья» — объекты без familyFriendly не предлагаем вовсе,
    // но закреплённый вручную объект остаётся: это осознанный выбор человека
    .filter((p) => ctx.travelType !== 'family' || p.familyFriendly || pinned.has(p.id))
    .map((p) => ({ place: p, score: scorePlace(p, ctx) + (pinned.has(p.id) ? 100 : 0) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.place.visitMinutes - b.place.visitMinutes);

  // интересы не выбраны — эшелонировать нечего, порядок и есть ответ
  if (wanted.size === 0) return scored.map((s) => s.place);

  return [
    ...scored.filter((s) => matchesInterests(s.place, ctx)),
    ...scored.filter((s) => !matchesInterests(s.place, ctx)),
  ].map((s) => s.place);
}

/**
 * Отвечает ли объект тому, ради чего человек едет.
 *
 * Закреплённый вручную объект считается подходящим всегда: человек уже сказал,
 * что хочет именно его, и спорить с этим система не должна.
 */
export function matchesInterests(place: Place, ctx: TripContext): boolean {
  if (!ctx.interests?.length) return true;
  if ((ctx.pinned ?? []).includes(place.id)) return true;
  return place.interests.some((interest) => ctx.interests.includes(interest));
}

/**
 * Набивает один день объектами одного города по бюджету времени.
 * Именно здесь чинится жалоба «объекты рядом, а система дала им по отдельному дню».
 */
/**
 * Сколько объектов в дне считается днём, а не пустым слотом. Ниже двух
 * маршрут перестаёт быть маршрутом, поэтому до двух добираем даже тем,
 * что интересам не отвечает.
 */
const MIN_STOPS_PER_DAY = 2;

function fillDay(
  pool: Place[],
  budgetMinutes: number,
  /** Отвечает ли объект интересам поездки. Без предиката день набивается как раньше. */
  relevant?: (place: Place) => boolean,
): Place[] {
  const picked: Place[] = [];
  let minutes = 0;

  const take = (place: Place) => {
    picked.push(place);
    minutes += place.visitMinutes;
  };

  // Сначала — только то, ради чего человек едет. Раньше день набивался
  // по времени чем угодно из региона, и «ziyorat», «tabiat» и «taom» давали
  // один и тот же список объектов, отличавшийся только порядком.
  for (const place of pool) {
    if (relevant && !relevant(place)) continue;
    if (minutes + place.visitMinutes > budgetMinutes) continue;
    take(place);
  }

  // Затем добираем до минимума: свободное время само по себе не повод
  // ставить в план то, что человеку неинтересно, но пустой день — хуже.
  if (relevant) {
    for (const place of pool) {
      if (picked.length >= MIN_STOPS_PER_DAY) break;
      if (relevant(place)) continue;
      if (minutes + place.visitMinutes > budgetMinutes) continue;
      take(place);
    }
  }

  if (picked.length === 0 && pool.length) picked.push(pool[0]);
  return picked;
}

/**
 * Заголовок дня: город и первый объект. Порядок объектов может поменяться
 * от погоды, поэтому заголовок собирается отдельной функцией — чтобы его
 * можно было пересобрать вместе с порядком, а не оставить от прежнего.
 */
function dayTitle(places: Place[], lang: Lang): string {
  const city = REGION_NAME[places[0].region][lang];
  return places.length > 1
    ? `${city}: ${places[0].name[lang]} + ${TEXT.more[lang]} ${places.length - 1}`
    : `${city}: ${places[0].name[lang]}`;
}

/**
 * Проставляет время осмотра по текущему порядку объектов.
 *
 * Считается один раз на порядок, а не один раз на день: погода объекты
 * переставляет, и без пересчёта маршрут читался «10:30, 09:00, 12:15» —
 * время от прежнего порядка при новом составе строк.
 */
function schedule(
  items: ItineraryItem[],
  byId: Map<string, Place>,
  transferMinutes: number,
): ItineraryItem[] {
  // день с переездом начинается позже: сначала доехали, потом смотрим
  let startedAt = DAY_START + transferMinutes;
  return items.map((item) => {
    const place = byId.get(item.placeId);
    const at = clock(startedAt);
    // закрыт, если приходим после закрытия или до открытия
    const closed =
      place?.closes !== undefined &&
      (startedAt >= place.closes || (place.opens !== undefined && startedAt < place.opens));
    startedAt += (place?.visitMinutes ?? 0) + HOP_MINUTES;
    return { ...item, at, closed };
  });
}

function makeDay(
  dayNumber: number,
  picked: Place[],
  ctx: TripContext,
  lang: Lang,
  transfer?: Transfer,
): ItineraryDay {
  const ordered = orderByProximity(picked);
  const transferMinutes = transfer ? Math.round(transferHours(transfer) * 60) : 0;
  return {
    day: dayNumber,
    title: dayTitle(ordered, lang),
    transfer,
    items: schedule(
      ordered.map((p, index) => ({ placeId: p.id, note: noteFor(p, ctx, lang, index === 0) })),
      new Map(ordered.map((p) => [p.id, p])),
      transferMinutes,
    ),
  };
}

/** Ориентировочная стоимость: билеты плюс самый дешёвый вариант каждого переезда. */
function estimateCost(days: ItineraryDay[], byId: Map<string, Place>): TripCost {
  const ticketsUsd = days
    .flatMap((d) => d.items)
    .reduce((sum, item) => sum + (byId.get(item.placeId)?.ticketUsd ?? 0), 0);
  const transferUsd = days.reduce((sum, day) => {
    if (!day.transfer) return sum;
    const cheapest = Math.min(...day.transfer.options.map((o) => o.priceUsd));
    return sum + cheapest;
  }, 0);
  return {
    ticketsUsd: Math.round(ticketsUsd),
    transferUsd: Math.round(transferUsd),
    totalUsd: Math.round(ticketsUsd + transferUsd),
  };
}

/**
 * Применяет погоду к уже собранному дню: меняет порядок объектов и называет
 * причину. Состав дня НЕ трогает — иначе турист, приехавший ради Регистана,
 * получит план без Регистана из-за двух миллиметров дождя.
 */
function applyWeather(day: ItineraryDay, weather: DayWeather, byId: Map<string, Place>, lang: Lang): ItineraryDay {
  const advice = adviceFor(weather);
  const outdoor = (id: string) => byId.get(id)?.outdoor ?? false;

  let items = day.items;
  let note: string | undefined;

  if (advice === 'heat') {
    items = [...items].sort((a, b) => Number(outdoor(b.placeId)) - Number(outdoor(a.placeId)));
    note = TEXT.weatherHeat[lang].replace('{t}', String(weather.tMaxC));
  } else if (advice === 'rain') {
    items = [...items].sort((a, b) => Number(outdoor(a.placeId)) - Number(outdoor(b.placeId)));
    note = TEXT.weatherRain[lang].replace('{mm}', String(weather.precipMm));
  } else if (advice === 'short-day') {
    note = TEXT.weatherShortDay[lang].replace('{t}', String(weather.tMaxC));
  }

  // Порядок изменился — значит устарели и время осмотра, и заголовок дня:
  // оба считались по прежнему порядку. Пересобираем ровно теми же функциями,
  // что и при сборке дня, иначе два места разъезжаются.
  let title = day.title;
  if (items !== day.items) {
    const places = items.flatMap((item) => {
      const place = byId.get(item.placeId);
      return place ? [place] : [];
    });
    const transferMinutes = day.transfer ? Math.round(transferHours(day.transfer) * 60) : 0;
    items = schedule(items, byId, transferMinutes);
    if (places.length > 0) title = dayTitle(places, lang);
  }

  // Сезон известен из даты погоды: Рамадан и Навруз меняют часы работы
  // и людность сильнее любого дождя, а для зиёрат-туризма — важнее всего.
  return {
    ...day,
    title,
    items,
    weather,
    weatherNote: note,
    seasonNote: seasonNote(weather.date, lang) ?? undefined,
  };
}

export function buildItinerary(
  places: Place[],
  ctx: TripContext,
  /** Погода по дням: элемент i — день i+1. Нет погоды — работают прежние правила. */
  weatherByDay?: DayWeather[],
): Itinerary {
  const lang = ctx.lang;
  const pool = eligible(places, ctx);
  if (pool.length === 0) return { summary: TEXT.empty[lang], days: [] };

  const byRegion = new Map<Region, Place[]>();
  for (const place of pool) {
    byRegion.set(place.region, [...(byRegion.get(place.region) ?? []), place]);
  }

  // Порядок городов: сначала тот, откуда турист стартует, дальше — ближайший
  // по времени в пути. Если старт не указан, работает прежнее правило —
  // точка входа в страну.
  const regions = [...byRegion.keys()];
  const route: Region[] = [];
  const start =
    ctx.startRegion && regions.includes(ctx.startRegion)
      ? ctx.startRegion
      : regions.includes(ENTRY_REGION)
        ? ENTRY_REGION
        : regions[0];
  let current = start;
  const remaining = new Set(regions);
  while (remaining.size) {
    route.push(current);
    remaining.delete(current);
    if (!remaining.size) break;
    // Следующий город выбираем по времени в пути, а не по прямой линии на карте:
    // до Самарканда есть поезд (2 ч), до Нураты только машина (4 ч), хотя по
    // карте Нурата ближе. Турист едет по расписанию, а не по циркулю.
    const hoursTo = (region: Region) =>
      transferHours(
        buildTransfer(
          current,
          region,
          haversineKm(centroid(byRegion.get(current)!), centroid(byRegion.get(region)!)),
        ),
      );
    current = [...remaining].sort((a, b) => hoursTo(a) - hoursTo(b))[0];
  }

  const days: ItineraryDay[] = [];
  let previousRegion: Region | null = null;

  for (const region of route) {
    let cityPool = [...byRegion.get(region)!];
    let firstDayInCity = true;

    while (cityPool.length && days.length < ctx.days) {
      let budget = dayBudget(ctx, days.length);
      let transfer: Transfer | undefined;

      // первый день в новом городе укорачивается на дорогу
      if (firstDayInCity && previousRegion && previousRegion !== region) {
        transfer = buildTransfer(
          previousRegion,
          region,
          haversineKm(centroid(byRegion.get(previousRegion)!), centroid(byRegion.get(region)!)),
        );
        budget = Math.max(120, dayBudget(ctx, days.length) - transferHours(transfer) * 60);
      }
      firstDayInCity = false;

      let picked = fillDay(cityPool, budget, (place) => matchesInterests(place, ctx));
      // летом открытые объекты ставим в начало дня — на утреннюю прохладу
      if (ctx.summer) {
        picked = [...picked].sort((a, b) => Number(b.outdoor) - Number(a.outdoor));
      }
      cityPool = cityPool.filter((p) => !picked.includes(p));
      days.push(makeDay(days.length + 1, picked, ctx, lang, transfer));
      previousRegion = region;
    }
    if (days.length >= ctx.days) break;
  }

  // Возвращение в точку старта: только для маршрута по стране и если есть запас
  // дня. Возвращаемся туда, откуда человек выехал, — это его вокзал, гостиница
  // и обратный билет; при незаданном старте это по-прежнему Ташкент.
  const lastRegion = days.length ? previousRegion : null;
  if (
    selectedRegions(ctx).length === 0 &&
    lastRegion &&
    lastRegion !== start &&
    byRegion.has(start) &&
    days.length < ctx.days
  ) {
    const transfer = buildTransfer(
      lastRegion,
      start,
      haversineKm(centroid(byRegion.get(lastRegion)!), centroid(byRegion.get(start)!)),
    );
    const used = new Set(days.flatMap((d) => d.items.map((i) => i.placeId)));
    const leftovers = byRegion.get(start)!.filter((p) => !used.has(p.id));
    if (leftovers.length) {
      const picked = fillDay(
        leftovers,
        Math.max(120, dayBudget(ctx, days.length) - transferHours(transfer) * 60),
        (place) => matchesInterests(place, ctx),
      );
      days.push(makeDay(days.length + 1, picked, ctx, lang, transfer));
    }
  }

  const total = days.reduce((sum, d) => sum + d.items.length, 0);
  const cities = new Set(days.flatMap((d) => d.items.map((i) => pool.find((p) => p.id === i.placeId)!.region)));
  // «По стране» — это когда страна и выбрана. Два выбранных региона дают маршрут
  // по двум городам, и стартует он там, где реально начинается, а не в Ташкенте.
  const countrywide = selectedRegions(ctx).length === 0;
  const template = countrywide
    ? TEXT.summaryMultiCity
    : cities.size > 1
      ? TEXT.summaryCities
      : TEXT.summaryOneCity;
  const startRegion = days.length
    ? pool.find((p) => p.id === days[0].items[0].placeId)!.region
    : ENTRY_REGION;

  const summary =
    template[lang]
      .replace('{days}', String(days.length))
      .replace('{n}', String(total))
      .replace('{cities}', String(cities.size))
      .replace('{start}', REGION_NAME[startRegion][lang])
      // формат поездки показываем словом на языке интерфейса, а не ключом «solo»
      .replace('{type}', TRAVEL_TYPE_LABEL[ctx.travelType][lang]) +
    (days.length < ctx.days ? TEXT.shortened[lang].replace('{asked}', String(ctx.days)) : '');

  const byId = new Map(places.map((p) => [p.id, p]));
  const withWeather = weatherByDay?.length
    ? days.map((day, index) =>
        weatherByDay[index] ? applyWeather(day, weatherByDay[index], byId, lang) : day,
      )
    : days;

  return { summary, days: withWeather, cost: estimateCost(withWeather, byId) };
}
