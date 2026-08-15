// Единые типы прототипа. Импортируются ТОЛЬКО как `import type`,
// чтобы data/* и lib/* оставались без рантайм-зависимостей (нужно для npm run check).

export type Lang = 'uz' | 'ru' | 'en';

/** Строка на трёх языках интерфейса. */
export type I18nText = Record<Lang, string>;

export type Region =
  | 'samarkand'
  | 'bukhara'
  | 'khiva'
  | 'tashkent'
  | 'shakhrisabz'
  | 'nurata';

export type Interest =
  | 'history'
  | 'architecture'
  | 'religion'
  | 'nature'
  | 'food'
  | 'crafts'
  | 'photo';

export type TravelType = 'solo' | 'family' | 'group';

/** Темп: сколько часов осмотра турист готов выдержать за день. */
export type Pace = 'relaxed' | 'normal' | 'packed';

/** Дневной бюджет поездки. Тот же вопрос, что в мобильном приложении. */
export type Budget = 'low' | 'mid' | 'high';

/** Языки, на которых турист готов общаться с гидом. */
export type GuideLang = 'uz' | 'ru' | 'en' | 'tr' | 'ar' | 'zh' | 'fr' | 'de';

export type TripContext = {
  /** Пустой список = вся страна. Регионов можно выбрать несколько. */
  regions: Region[];
  /** Даты поездки в формате YYYY-MM-DD; число дней считается из них. */
  startDate?: string;
  endDate?: string;
  region: Region | 'all';
  interests: Interest[];
  travelType: TravelType;
  days: number;
  lang: Lang;
  /** Летняя поездка: объекты под открытым небом уходят на утро и вечер. */
  summer: boolean;
  /** Темп поездки. По умолчанию обычный. */
  pace?: Pace;
  /** Дневной бюджет: меняет очки объектов, выбор переезда и предупреждения. */
  budget?: Budget;
  /**
   * Языки общения туриста. Не то же самое, что язык интерфейса: узбек может
   * искать англоязычного гида, и подбор обязан идти по этому полю.
   */
  guideLangs?: GuideLang[];
  /** Объекты, которые турист убрал руками. */
  excluded?: string[];
  /** Объекты, которые турист хочет обязательно — они идут в маршрут первыми. */
  pinned?: string[];
  /**
   * Только объекты, доступные для коляски. Жёсткий фильтр, как семейный:
   * поле `accessible` у объектов было объявлено и не использовалось нигде,
   * кроме значка в каталоге, — данные держали и не применяли.
   */
  accessibleOnly?: boolean;
  /**
   * Закладки: объекты, отложенные «на посмотреть». Это не то же самое, что
   * `pinned`: закреплённый обязан попасть в маршрут, а сохранённый просто
   * лежит в личном списке и ни на что не влияет.
   */
  saved?: string[];
};

export type Place = {
  id: string;
  name: I18nText;
  region: Region;
  lat: number;
  lng: number;
  interests: Interest[];
  visitMinutes: number;
  familyFriendly: boolean;
  /** Осмотр под открытым небом — важно летом, когда днём выше +38. */
  outdoor: boolean;
  summary: I18nText;
  /** Что посмотреть внутри: музей, рукопись, смотровая — турист хочет знать заранее. */
  highlights?: I18nText[];
  /**
   * Часы работы в минутах от полуночи. Маршрут, ставящий Регистан на 18:30,
   * когда он закрыт, — это не маршрут, а список.
   * Для площадей и открытых пространств не задаётся: туда можно в любое время.
   */
  opens?: number;
  closes?: number;
  /** Входной билет, ориентировочно в долларах. Нужен, чтобы посчитать бюджет поездки. */
  ticketUsd?: number;
  /**
   * Доступность для людей с ограниченной подвижностью: коляска проезжает,
   * есть пандус или лифт. Комитету важен инклюзивный туризм, а familyFriendly
   * про другое — про интерес детей, а не про физическую доступность.
   */
  accessible?: boolean;
};

/** Инфраструктура по маршруту: заправки, туалеты, намазхона, медпункт, кафе. */
export type PoiKind = 'gas' | 'toilet' | 'prayer' | 'clinic' | 'cafe';

export type Poi = {
  id: string;
  kind: PoiKind;
  /** Только для заправок: метан или бензин — для узбекистанца это разные вещи. */
  fuel?: 'methane' | 'petrol';
  name: I18nText;
  lat: number;
  lng: number;
  region: Region;
};

export type Gender = 'female' | 'male';

/** Отзыв ссылается на локализованный шаблон, чтобы не дублировать текст на трёх языках. */
export type GuideReview = { author: string; rating: number; templateId: string };

export type Guide = {
  id: string;
  name: string;
  languages: string[];
  regions: Region[];
  specializations: Interest[];
  travelTypes: TravelType[];
  gender: Gender;
  /** Есть свой транспорт для переездов. */
  hasTransport: boolean;
  experienceYears: number;
  rating: number;
  reviews: number;
  pricePerDay: number;
  /** ДЕМО-признак. В проде подтверждается реестром Комитета по туризму. */
  verified: boolean;
  /** §9 ТЗ: из чего складывается статус «подтверждён» — это должно быть видно туристу. */
  verification: {
    license: string | null;
    registry: boolean;
    identity: boolean;
    languagesChecked: boolean;
    checkedAt: string | null;
  };
  bio: I18nText;
  reviewsList: GuideReview[];
};

/**
 * Качество источника. ЮНЕСКО, реестры и музейные публикации — первичные;
 * туристические порталы и сводные статьи — вторичные. Раньше в вердикте они
 * стояли рядом как равные, хотя вес у них разный, и это подрывало главный
 * тезис продукта — про достоверность.
 */
export type SourceTier = 'official' | 'secondary';

export type Source = { title: I18nText; url: string; tier?: SourceTier };

/**
 * Корпус хранится на языке источника (русский) — это канон, его не переводим.
 * Ответ пользователю формируется на языке интерфейса.
 */
export type CorpusItem = {
  id: string;
  placeId?: string;
  region?: Region;
  text: string;
  keywords: string[];
  source: Source;
};

export type ItineraryItem = {
  placeId: string;
  note: string;
  /** Ориентировочное начало осмотра, «HH:MM». День стартует в 9:00. */
  at?: string;
  /** Объект в это время уже закрыт — предупреждаем, а не молчим. */
  closed?: boolean;
};

/** Погода одного дня маршрута. `source` показывается туристу: прогноз ≠ норма. */
export type DayWeather = {
  date: string;
  region: Region;
  tMaxC: number;
  precipMm: number;
  /**
   * Максимальный ветер за день, км/ч. В Узбекистане это не мелочь: весной
   * с ветром приходит пыль, и на открытых площадках день переносится иначе,
   * чем при той же температуре в штиль. Прогноз отдаёт его тем же запросом.
   */
  windKmh?: number;
  source: 'forecast' | 'norm';
};

/** Что делать с этим днём: жара, дождь, короткий световой день или обычный день. */
export type WeatherAdvice = 'heat' | 'rain' | 'short-day' | 'fine';

/** Ориентировочная стоимость поездки. Не тариф — оценка по демо-данным. */
export type TripCost = {
  ticketsUsd: number;
  transferUsd: number;
  totalUsd: number;
  /** Траты по дням: без них не сказать, какой именно день вылез за бюджет. */
  perDayUsd?: number[];
};

export type TransferMode = 'plane' | 'train' | 'bus' | 'car' | 'minibus';

export type TransferOption = {
  mode: TransferMode;
  hours: number;
  /** Ориентировочная цена в долларах на человека — демо-оценка, не тариф. */
  priceUsd: number;
};

export type Transfer = {
  fromRegion: Region;
  toRegion: Region;
  km: number;
  options: TransferOption[];
};

export type ItineraryDay = {
  day: number;
  title: string;
  /** Заполняется, если день начинается с переезда между городами. */
  transfer?: Transfer;
  items: ItineraryItem[];
  /** Погода дня и её причина — почему объекты стоят в таком порядке. */
  weather?: DayWeather;
  weatherNote?: string;
  /** Рамадан, Ураза-байрам или Навруз — они меняют часы работы и людность. */
  seasonNote?: string;
};

export type Itinerary = {
  summary: string;
  days: ItineraryDay[];
  cost?: TripCost;
  /**
   * Какие правила сработали именно на этом маршруте, словами.
   * Главный тезис продукта — не чёрный ящик, и доказывать его должен сам
   * маршрут, а не обещание в презентации.
   */
  rules?: string[];
};

export type CheckStatus = 'confirmed' | 'refuted' | 'unclear';

export type CheckVerdict = {
  claim: string;
  status: CheckStatus;
  explanation: string;
  correction?: string;
  sources: { title: string; url: string; tier?: SourceTier }[];
};

/** ai — ответ модели, offline — предзаписанный/правило-основанный ответ (демо без сети). */
export type Mode = 'ai' | 'offline';

/**
 * Накопленная статистика проверок фактов, произнесённых гидом.
 * Это замыкает три модуля: проверка фактов → репутация гида → подбор гида.
 */
export type GuideAccuracy = {
  confirmed: number;
  refuted: number;
  unclear: number;
};

/** Точность гида в разрезе объектов: ключ — placeId, значение — счётчики вердиктов. */
export type GuideAccuracyByPlace = Record<string, GuideAccuracy>;

/**
 * Отдельная запись проверки — нужна, чтобы гид видел не только цифру,
 * но и какие именно утверждения ему засчитали, и мог их оспорить.
 */
export type FactRecord = {
  id: string;
  guideId: string;
  placeId?: string;
  claim: string;
  status: CheckStatus;
  at: string;
  /** Гид не согласен: пояснение уходит в разбор Комитету. */
  dispute?: { note: string; at: string; resolved?: 'upheld' | 'rejected' };
};

/** Заявка от туриста: проблема на объекте или запрос гида. */
export type RequestKind = 'place-problem' | 'guide-booking';

/**
 * Что стало с заявкой. `new` — лежит во входящих, `taken` — гид взял,
 * `busy` — гид занят на эти даты. Отказ тоже ответ: молчание хуже отказа.
 */
export type RequestStatus = 'new' | 'taken' | 'busy';

export type TouristRequest = {
  id: string;
  kind: RequestKind;
  /** Объект или гид, к которому относится заявка. */
  targetId: string;
  message: string;
  contact: string;
  at: string;
  done?: boolean;
  /**
   * Короткий код для туриста. У него нет аккаунта, и по этому коду он
   * проверяет, что с заявкой: заводить регистрацию ради одной кнопки —
   * лишний барьер там, где хватает шести знаков.
   */
  code?: string;
  status?: RequestStatus;
  /** Ответ гида: дата и слово. */
  reply?: { at: string; note?: string };
};

/**
 * Откуда турист услышал утверждение.
 *
 * Гид — не единственный источник ошибок: чаще всего человек читает табличку
 * у входа или первую ссылку в поиске. Разделив источники, Комитет узнаёт не
 * «кто-то ошибается», а «на этом объекте табличка вводит в заблуждение» —
 * и это уже поручение подрядчику.
 */
export type ClaimSource = 'guide' | 'sign' | 'internet' | 'other';

export type ScoredGuide = {
  guide: Guide;
  score: number;
  why: string;
  accuracy?: GuideAccuracy;
  /** Разбивка по объектам: где именно гид силён, а где нет. */
  byPlace?: GuideAccuracyByPlace;
};
