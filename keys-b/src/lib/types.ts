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

export type Source = { title: I18nText; url: string };

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
};

export type Itinerary = {
  summary: string;
  days: ItineraryDay[];
};

export type CheckStatus = 'confirmed' | 'refuted' | 'unclear';

export type CheckVerdict = {
  claim: string;
  status: CheckStatus;
  explanation: string;
  correction?: string;
  sources: { title: string; url: string }[];
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

export type ScoredGuide = {
  guide: Guide;
  score: number;
  why: string;
  accuracy?: GuideAccuracy;
  /** Разбивка по объектам: где именно гид силён, а где нет. */
  byPlace?: GuideAccuracyByPlace;
};
