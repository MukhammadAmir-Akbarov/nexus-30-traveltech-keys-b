/**
 * Разбор и проверка тела запроса для всех ручек API.
 *
 * ВРЕМЕННОЕ МЕСТО. По смыслу файл принадлежит `src/lib/`, но на время
 * параллельной работы трёх агентов `src/lib/**` занят другим человеком, а
 * `src/app/api/**` — этот. Имя с подчёркиванием: App Router не считает такой
 * файл маршрутом, новой ручки из него не появится. Когда работа разойдётся,
 * файл переезжает в `src/lib/api-schema.ts` без изменений внутри.
 *
 * Зачем вообще: каждая ручка звала `await req.json()` без защиты. Тело не
 * разобралось — SyntaxError уходил наверх и превращался в HTTP 500. Из 14
 * проверок битым телом семь отвечали пятисоткой. Пятисотка на демо читается
 * как «прототип падает», хотя это всего лишь неразобранный ввод.
 *
 * Вторая, более тихая беда: `matchGuides` фильтрует по
 * `q.gender === 'any' || g.gender === q.gender`. Если `gender` не пришёл,
 * оба сравнения ложны и отсеиваются ВСЕ гиды: пустой список, HTTP 200, ни
 * ошибки, ни лога. Измерено: без поля — 0 гидов, с `gender: 'any'` — 5.
 * Поэтому разумные значения по умолчанию проставляются здесь, на границе,
 * а не правкой фильтра: сам фильтр лежит в чужой зоне и работает верно.
 */
import { z } from 'zod';

/*
 * Везде `looseObject`, а не `object`. Проверено на zod 4.4.3: `z.object()`
 * молча выбрасывает незнакомые ключи. Соседний агент прямо сейчас дополняет
 * `TripContext` — так `startRegion` (город, откуда турист стартует) исчез бы
 * по дороге к планировщику, и чужая функция умерла бы без единого признака.
 * `looseObject` пропускает незнакомое дальше: проверка защищает от мусора,
 * но не мешает соседней работе.
 */

export const langSchema = z.enum(['uz', 'ru', 'en']);
export const regionSchema = z.enum([
  'samarkand',
  'bukhara',
  'khiva',
  'tashkent',
  'shakhrisabz',
  'nurata',
]);
export const interestSchema = z.enum([
  'history',
  'architecture',
  'religion',
  'nature',
  'food',
  'crafts',
  'photo',
]);
export const travelTypeSchema = z.enum(['solo', 'couple', 'family', 'group']);
export const paceSchema = z.enum(['relaxed', 'normal', 'packed']);

/** Дата поездки: строго YYYY-MM-DD, дальше её разбирает `tripDates`. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ожидается YYYY-MM-DD');

/**
 * Контекст поездки. Поля и значения по умолчанию сверены с тем, что реально
 * читает `planner.ts` (grep по `ctx.`), а не с типом: тип мог уйти вперёд.
 *
 * `days` ограничен 1..14 — это `MAX_DAYS` самого приложения
 * (`TripSetup.tsx:35`, `voice-trip.ts:53`). Граница не выдумана здесь, а
 * повторяет уже существующий договор с пользователем.
 */
export const tripContextSchema = z.looseObject({
  regions: z.array(regionSchema).default([]),
  region: z.union([regionSchema, z.literal('all')]).default('all'),
  interests: z.array(interestSchema).default([]),
  travelType: travelTypeSchema.default('solo'),
  days: z.number().int().min(1).max(14).default(2),
  lang: langSchema.default('ru'),
  summer: z.boolean().default(false),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  pace: paceSchema.optional(),
  excluded: z.array(z.string()).optional(),
  pinned: z.array(z.string()).optional(),
  startRegion: regionSchema.optional(),
});

/**
 * Запрос на подбор гида.
 *
 * `accuracy` и `accuracyByPlace` сюда намеренно НЕ входят: это репутация гида
 * по проверкам фактов, и она берётся на сервере из хранилища. Принимать её из
 * тела значило бы дать любому желающему нарисовать себе точность.
 * Порядок spread в ручке уже перекрывает клиентские значения серверными —
 * схема закрепляет это ещё и на входе.
 */
export const guideQuerySchema = tripContextSchema.extend({
  languages: z.array(z.string()).default([]),
  gender: z.enum(['female', 'male', 'any']).default('any'),
  needTransport: z.boolean().default(false),
  placeIds: z.array(z.string()).optional(),
});

/**
 * Проверка по фотографии — третий вход в ту же ручку /api/check.
 *
 * Отдельного маршрута нет намеренно: кейс требует «голос, текст, фото — одна
 * проверка», а не три продукта. Поле `image` появляется рядом с `claim`, и
 * если его нет, ручка ведёт себя ровно как раньше.
 *
 * Предел стоит на длине строки base64, а не на размере после декодирования:
 * декодировать сначала, а мерить потом — значит принять в память сколько
 * прислали. 5.6 млн символов base64 — это те самые 4 МБ снимка плюс padding.
 * Телефонная фотография укладывается; всё, что больше, это уже не проверка
 * таблички у медресе.
 *
 * mime перечислен явно: три формата, которые действительно приходят с камеры.
 * Всё остальное — 400 с внятным кодом, а не попытка «разобраться на месте».
 */
const MAX_IMAGE_BASE64 = 5_600_000;

export const imageCheckSchema = z.looseObject({
  image: z.string().min(16).max(MAX_IMAGE_BASE64),
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  lang: langSchema.default('ru'),
});

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Разбирает тело и проверяет схемой. Наружу — те же машинные коды ошибок,
 * что и в остальных ручках (`{ error: '...' }`), интерфейс переводит их сам.
 * Тексты не локализуются: язык ответа выбирает клиент, а не ручка.
 */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<Parsed<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    // именно 400: тело не разобрано — это ошибка запроса, а не сбой сервера
    return { ok: false, response: Response.json({ error: 'bad_json' }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // первая проблема, а не весь список: клиенту нужно понять, что чинить
    const first = result.error.issues[0];
    return {
      ok: false,
      response: Response.json(
        { error: 'bad_request', field: first?.path.join('.') || undefined, detail: first?.message },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
}

/**
 * Только разбор тела, без схемы: для ручек, где проверка полей уже написана
 * и работает (заявки, вход, регистрация, оспаривание). Переписывать их
 * проверки ради единообразия — лишний риск накануне защиты.
 */
export async function readJson(req: Request): Promise<Parsed<Record<string, unknown>>> {
  try {
    const raw = (await req.json()) as Record<string, unknown>;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, response: Response.json({ error: 'bad_json' }, { status: 400 }) };
    }
    return { ok: true, data: raw };
  } catch {
    return { ok: false, response: Response.json({ error: 'bad_json' }, { status: 400 }) };
  }
}
