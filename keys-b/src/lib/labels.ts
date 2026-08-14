import type { Interest, TravelType } from './types.ts';

export const INTEREST_LABEL: Record<Interest, string> = {
  history: 'история',
  architecture: 'архитектура',
  religion: 'святыни',
  nature: 'природа',
  food: 'еда',
  crafts: 'ремёсла',
  photo: 'фото',
};

export const TRAVEL_TYPE_LABEL: Record<TravelType, string> = {
  solo: 'соло',
  family: 'семья',
  group: 'группа',
};

export const INTERESTS = Object.keys(INTEREST_LABEL) as Interest[];
export const TRAVEL_TYPES = Object.keys(TRAVEL_TYPE_LABEL) as TravelType[];
