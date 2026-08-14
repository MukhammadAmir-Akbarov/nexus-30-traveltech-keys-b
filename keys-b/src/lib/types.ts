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
  region: Region | 'all';
  interests: Interest[];
  travelType: TravelType;
  days: number;
  lang: Lang;
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
  summary: I18nText;
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

export type ItineraryDay = {
  day: number;
  title: string;
  /** Заполняется, если день начинается с переезда между городами. */
  transfer?: string;
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

export type ScoredGuide = {
  guide: Guide;
  score: number;
  why: string;
};
