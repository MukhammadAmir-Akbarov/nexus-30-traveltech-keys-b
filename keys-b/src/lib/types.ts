// Единые типы прототипа. Импортируются ТОЛЬКО как `import type`,
// чтобы data/* и lib/* оставались без рантайм-зависимостей (нужно для npm run check).

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
};

export type Place = {
  id: string;
  name: string;
  localName: string;
  region: Region;
  lat: number;
  lng: number;
  interests: Interest[];
  visitMinutes: number;
  familyFriendly: boolean;
  summary: string;
};

export type Guide = {
  id: string;
  name: string;
  languages: string[];
  regions: Region[];
  specializations: Interest[];
  travelTypes: TravelType[];
  experienceYears: number;
  rating: number;
  reviews: number;
  pricePerDay: number;
  /** ДЕМО-признак. В проде подтверждается реестром Комитета по туризму. */
  verified: boolean;
  bio: string;
};

export type Source = { title: string; url: string };

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
  sources: Source[];
};

/** ai — ответ модели, offline — предзаписанный/правило-основанный ответ (демо без сети). */
export type Mode = 'ai' | 'offline';

export type ScoredGuide = {
  guide: Guide;
  score: number;
  why: string;
};
