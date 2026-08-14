import type { I18nText, Interest, Lang, Region, TravelType } from './types.ts';

export const LANGS: Lang[] = ['uz', 'ru', 'en'];

export const LANG_LABEL: Record<Lang, string> = {
  uz: 'O‘zbekcha',
  ru: 'Русский',
  en: 'English',
};

/** Достать строку нужного языка из мультиязычного поля. */
export function tr(text: I18nText, lang: Lang): string {
  return text[lang] ?? text.ru;
}

export const REGION_LABEL: Record<Region, I18nText> = {
  samarkand: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
  bukhara: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
  khiva: { uz: 'Xiva', ru: 'Хива', en: 'Khiva' },
  tashkent: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
  shakhrisabz: { uz: 'Shahrisabz', ru: 'Шахрисабз', en: 'Shakhrisabz' },
  nurata: { uz: 'Nurota / Aydarko‘l', ru: 'Нурата / Айдаркуль', en: 'Nurata / Aydarkul' },
};

export const INTEREST_LABEL: Record<Interest, I18nText> = {
  history: { uz: 'tarix', ru: 'история', en: 'history' },
  architecture: { uz: 'me’morchilik', ru: 'архитектура', en: 'architecture' },
  religion: { uz: 'ziyorat', ru: 'святыни', en: 'sacred sites' },
  nature: { uz: 'tabiat', ru: 'природа', en: 'nature' },
  food: { uz: 'taom', ru: 'еда', en: 'food' },
  crafts: { uz: 'hunarmandchilik', ru: 'ремёсла', en: 'crafts' },
  photo: { uz: 'foto', ru: 'фото', en: 'photo' },
};

export const TRAVEL_TYPE_LABEL: Record<TravelType, I18nText> = {
  solo: { uz: 'yakka', ru: 'соло', en: 'solo' },
  family: { uz: 'oila', ru: 'семья', en: 'family' },
  group: { uz: 'guruh', ru: 'группа', en: 'group' },
};

export const GUIDE_LANG_LABEL: Record<string, I18nText> = {
  any: { uz: 'ixtiyoriy', ru: 'любой', en: 'any' },
  ru: { uz: 'rus', ru: 'русский', en: 'Russian' },
  en: { uz: 'ingliz', ru: 'английский', en: 'English' },
  uz: { uz: 'o‘zbek', ru: 'узбекский', en: 'Uzbek' },
  fr: { uz: 'fransuz', ru: 'французский', en: 'French' },
  de: { uz: 'nemis', ru: 'немецкий', en: 'German' },
  tr: { uz: 'turk', ru: 'турецкий', en: 'Turkish' },
};

export const INTERESTS = Object.keys(INTEREST_LABEL) as Interest[];
export const TRAVEL_TYPES = Object.keys(TRAVEL_TYPE_LABEL) as TravelType[];
export const REGIONS: (Region | 'all')[] = [
  'all',
  'samarkand',
  'bukhara',
  'khiva',
  'tashkent',
  'shakhrisabz',
  'nurata',
];

/** Словарь интерфейса. Ключ -> три языка. */
const UI = {
  brandSuffix: { uz: 'Hamroh', ru: 'Hamroh', en: 'Hamroh' },

  tabTrip: { uz: 'Sayohat', ru: 'Поездка', en: 'Trip' },
  tabCheck: { uz: 'Faktlarni tekshirish', ru: 'Проверка фактов', en: 'Fact check' },
  tabPlan: { uz: 'Marshrut', ru: 'Маршрут', en: 'Itinerary' },
  tabGuides: { uz: 'Gidlar', ru: 'Гиды', en: 'Guides' },

  contextPrefix: { uz: 'Sayohat konteksti:', ru: 'Контекст поездки:', en: 'Trip context:' },
  contextLoading: { uz: 'Kontekst yuklanmoqda…', ru: 'Загрузка контекста…', en: 'Loading context…' },
  allUzbekistan: { uz: 'Butun O‘zbekiston', ru: 'Весь Узбекистан', en: 'All Uzbekistan' },
  noInterests: { uz: 'qiziqishlar tanlanmagan', ru: 'интересы не выбраны', en: 'no interests selected' },
  daysShort: { uz: 'kun', ru: 'дн.', en: 'days' },

  themeLight: { uz: 'Yorug‘', ru: 'Светлая', en: 'Light' },
  themeDark: { uz: 'Qora', ru: 'Тёмная', en: 'Dark' },
  themeSystem: { uz: 'Tizim', ru: 'Система', en: 'System' },

  homeTitle: {
    uz: 'Ishonchli sayohat hamrohi',
    ru: 'Надёжный спутник туриста',
    en: 'A trustworthy travel companion',
  },
  homeLead: {
    uz: 'Bitta sayohat konteksti — uchta funksiya: gid aytayotgan ma’lumotni tekshirish, shaxsiy marshrut va mos gidni topish.',
    ru: 'Один контекст поездки — три функции: проверка того, что рассказывает гид, персональный маршрут и подбор гида.',
    en: 'One trip context, three functions: verify what your guide says, build a personal itinerary, find the right guide.',
  },
  fieldRegion: { uz: 'Hudud', ru: 'Регион', en: 'Region' },
  fieldInterests: { uz: 'Qiziqishlar', ru: 'Интересы', en: 'Interests' },
  fieldTravelType: { uz: 'Sayohat formati', ru: 'Формат поездки', en: 'Travel type' },
  fieldDays: { uz: 'Kunlar', ru: 'Дней', en: 'Days' },

  cardCheckTitle: { uz: '1 · Faktlarni tekshirish', ru: '1 · Проверка фактов', en: '1 · Fact check' },
  cardCheckText: {
    uz: 'Gid biror gap aytdi — uni rasmiy manbalar bo‘yicha ovoz yoki matn orqali tekshiring.',
    ru: 'Гид что-то сказал — проверьте по официальным источникам голосом или текстом.',
    en: 'Your guide said something — verify it against official sources by voice or text.',
  },
  cardPlanTitle: { uz: '2 · Marshrut', ru: '2 · Маршрут', en: '2 · Itinerary' },
  cardPlanText: {
    uz: 'Sayohat formati va qiziqishlaringizga mos, xaritali kunlik marshrut.',
    ru: 'Маршрут по дням с картой, собранный под ваш формат поездки и интересы.',
    en: 'A day-by-day itinerary with a map, built around your travel type and interests.',
  },
  cardGuidesTitle: { uz: '3 · Gidlar', ru: '3 · Гиды', en: '3 · Guides' },
  cardGuidesText: {
    uz: 'Marshrut, til va formatga mos gid — nega aynan u ekani izohi bilan.',
    ru: 'Подбор гида под маршрут, язык и формат с объяснением, почему именно он.',
    en: 'A guide matched to your route, language and format — with the reason why.',
  },

  checkTitle: {
    uz: 'Gid aytayotgan ma’lumotni tekshirish',
    ru: 'Проверка того, что говорит гид',
    en: 'Verify what your guide says',
  },
  checkLead: {
    uz: 'Javob faqat ulangan rasmiy manbalar asosida quriladi. Manbada ma’lumot bo‘lmasa, tizim shuni aytadi — o‘zidan to‘qimaydi.',
    ru: 'Ответ строится только по подключённым официальным источникам. Если в них нет данных — система так и скажет, а не придумает.',
    en: 'Answers come only from the connected official sources. If they hold no answer, the system says so instead of inventing one.',
  },
  checkPlaceholder: {
    uz: 'Masalan: «Registon XII asrda qurilgan»',
    ru: 'Например: «Регистан построен в XII веке»',
    en: 'For example: “Registan was built in the 12th century”',
  },
  checkButton: { uz: 'Tekshirish', ru: 'Проверить', en: 'Check' },
  checkLoading: { uz: 'Tekshiryapman…', ru: 'Проверяю…', en: 'Checking…' },
  checkError: {
    uz: 'Tekshirib bo‘lmadi. Yana urinib ko‘ring.',
    ru: 'Не удалось проверить. Попробуйте ещё раз.',
    en: 'Check failed. Please try again.',
  },
  voiceIdle: { uz: '🎙 Gid nutqini yozish', ru: '🎙 Записать речь гида', en: '🎙 Record the guide' },
  voiceListening: { uz: '● Tinglayapman…', ru: '● Слушаю…', en: '● Listening…' },
  statusConfirmed: { uz: 'Tasdiqlandi', ru: 'Подтверждено', en: 'Confirmed' },
  statusRefuted: { uz: 'Rad etildi', ru: 'Опровергнуто', en: 'Refuted' },
  statusUnclear: {
    uz: 'Manbalarda ma’lumot yo‘q',
    ru: 'Нет данных в источниках',
    en: 'No data in sources',
  },
  correctLabel: { uz: 'To‘g‘risi:', ru: 'Верно:', en: 'Correct version:' },
  sourcesLabel: { uz: 'Manbalar:', ru: 'Источники:', en: 'Sources:' },
  passagesLabel: {
    uz: 'Topilgan parchalarni ko‘rsatish',
    ru: 'Показать найденные отрывки',
    en: 'Show the retrieved passages',
  },
  modeAi: { uz: 'model javobi', ru: 'ответ модели', en: 'model answer' },
  modeOffline: { uz: 'oflayn rejim', ru: 'офлайн-режим', en: 'offline mode' },

  planTitle: {
    uz: 'Sayohat formatingizga mos marshrut',
    ru: 'Маршрут под ваш формат поездки',
    en: 'An itinerary for your travel type',
  },
  planLead: {
    uz: 'Yuqoridagi kontekstdan yig‘iladi: hudud, qiziqishlar, format va kunlar soni.',
    ru: 'Собирается из контекста сверху: регион, интересы, формат и число дней.',
    en: 'Built from the context above: region, interests, travel type and number of days.',
  },
  planChange: { uz: 'o‘zgartirish', ru: 'изменить', en: 'change' },
  planButton: { uz: 'Marshrut tuzish', ru: 'Построить маршрут', en: 'Build itinerary' },
  planLoading: { uz: 'Marshrut yig‘ilmoqda…', ru: 'Собираю маршрут…', en: 'Building…' },
  planError: {
    uz: 'Marshrut tuzilmadi. Yana urinib ko‘ring.',
    ru: 'Не удалось построить маршрут. Попробуйте ещё раз.',
    en: 'Could not build the itinerary. Please try again.',
  },
  planTotal: { uz: 'Jami', ru: 'Итого', en: 'Summary' },
  planModeAi: { uz: 'model tuzgan', ru: 'составлено моделью', en: 'built by the model' },
  planDay: { uz: 'Kun', ru: 'День', en: 'Day' },
  planMinutes: { uz: 'daq', ru: 'мин', en: 'min' },
  mapLoading: { uz: 'Xarita yuklanmoqda…', ru: 'Карта загружается…', en: 'Loading the map…' },

  guidesTitle: {
    uz: 'Marshrutingizga mos gid tanlash',
    ru: 'Подбор гида под ваш маршрут',
    en: 'Find a guide for your route',
  },
  guidesLead: {
    uz: 'Umumiy kontekstdagi hudud, qiziqish va format hisobga olinadi. «Tasdiqlangan» belgisi — demo.',
    ru: 'Учитываются регион, интересы и формат поездки из общего контекста. Метка «подтверждён» — демонстрационная.',
    en: 'Region, interests and travel type come from the shared context. The “verified” badge is a demo flag.',
  },
  guidesLanguage: { uz: 'Gid tili', ru: 'Язык гида', en: 'Guide language' },
  guidesLoading: { uz: 'Tanlanmoqda…', ru: 'Подбираю…', en: 'Matching…' },
  guidesEmpty: {
    uz: 'Joriy filtrlar bo‘yicha gid yo‘q — tilni yoki sayohat kontekstini o‘zgartiring.',
    ru: 'Под текущие фильтры гидов нет — измените язык или контекст поездки.',
    en: 'No guides match the current filters — change the language or the trip context.',
  },
  guidesVerified: { uz: '✓ tasdiqlangan (demo)', ru: '✓ подтверждён (демо)', en: '✓ verified (demo)' },
  guidesReviews: { uz: 'sharh', ru: 'отзывов', en: 'reviews' },
  guidesPerDay: { uz: 'kun', ru: 'день', en: 'day' },
  guidesYears: { uz: 'yillik tajriba', ru: 'лет опыта', en: 'years of experience' },
  guidesWhy: { uz: 'Nega u', ru: 'Почему он', en: 'Why this guide' },

  footer: {
    uz: 'NEXUS30 hakatoni uchun prototip. Obyektlar va gidlar ma’lumotlari — demo; ishchi versiyada Turizm qo‘mitasi bazasi ulanadi.',
    ru: 'Прототип для хакатона NEXUS30. Данные об объектах и гидах — демонстрационные; в рабочей версии подключается база Комитета по туризму.',
    en: 'A prototype for the NEXUS30 hackathon. Place and guide data is demo only; the production version connects the Tourism Committee database.',
  },
} satisfies Record<string, I18nText>;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, lang: Lang): string {
  return tr(UI[key], lang);
}
