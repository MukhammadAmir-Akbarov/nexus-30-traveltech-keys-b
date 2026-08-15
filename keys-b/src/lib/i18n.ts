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

// Отзыв с записи 5: трёх языков мало — гости из Франции, Италии и других стран
// могут не знать ни английского, ни русского. Узбекский обязателен: своя аудитория.
export const GUIDE_LANG_LABEL: Record<string, I18nText> = {
  uz: { uz: 'o‘zbek', ru: 'узбекский', en: 'Uzbek' },
  ru: { uz: 'rus', ru: 'русский', en: 'Russian' },
  en: { uz: 'ingliz', ru: 'английский', en: 'English' },
  fr: { uz: 'fransuz', ru: 'французский', en: 'French' },
  it: { uz: 'italyan', ru: 'итальянский', en: 'Italian' },
  de: { uz: 'nemis', ru: 'немецкий', en: 'German' },
  es: { uz: 'ispan', ru: 'испанский', en: 'Spanish' },
  tr: { uz: 'turk', ru: 'турецкий', en: 'Turkish' },
  ar: { uz: 'arab', ru: 'арабский', en: 'Arabic' },
  ja: { uz: 'yapon', ru: 'японский', en: 'Japanese' },
};

export const GUIDE_LANGS = Object.keys(GUIDE_LANG_LABEL);

export const GENDER_LABEL: Record<string, I18nText> = {
  any: { uz: 'farqi yo‘q', ru: 'неважно', en: 'any' },
  female: { uz: 'ayol gid', ru: 'женщина', en: 'female' },
  male: { uz: 'erkak gid', ru: 'мужчина', en: 'male' },
};

/** Тексты отзывов общие для всех гидов — в данных лежат только ссылки на шаблон. */
export const REVIEW_TEMPLATE: Record<string, I18nText> = {
  deep: {
    uz: 'Juda chuqur bilim. Savollarimning barchasiga manba bilan javob berdi.',
    ru: 'Очень глубокие знания. На все вопросы отвечал со ссылкой на источник.',
    en: 'Deep knowledge. Answered every question with a source.',
  },
  warm: {
    uz: 'Ochiq va samimiy, kun oxirigacha charchamadik.',
    ru: 'Открытый и доброжелательный, к концу дня совсем не устали.',
    en: 'Open and warm; we were not worn out by the end of the day.',
  },
  crafts: {
    uz: 'Ustaxonalarga olib bordi, hech bir turistik joyda bunday ko‘rmagandim.',
    ru: 'Отвёл в настоящие мастерские — такого в туристических местах не увидишь.',
    en: 'Took us into real workshops — nothing like the tourist spots.',
  },
  pace: {
    uz: 'Sur’at qulay, hech qayerga shoshilmadik.',
    ru: 'Комфортный темп, никуда не спешили.',
    en: 'Comfortable pace, never rushed.',
  },
  photo: {
    uz: 'Eng yaxshi yorug‘likni bilardi — suratlar ajoyib chiqdi.',
    ru: 'Знает, где какой свет — фотографии получились отличные.',
    en: 'Knew exactly where the light works — the photos came out great.',
  },
  food: {
    uz: 'Sayyohlar bormaydigan joylarda ovqatlandik.',
    ru: 'Поели там, куда туристы не доходят.',
    en: 'We ate where tourists never get to.',
  },
  family: {
    uz: 'Bolalar zerikmadi, ular uchun alohida topshiriqlar berdi.',
    ru: 'Дети не заскучали — придумывал для них отдельные задания.',
    en: 'The kids were never bored — he had tasks just for them.',
  },
  language: {
    uz: 'Til darajasi yuqori, tarjimonsiz hammasi tushunarli edi.',
    ru: 'Отличный уровень языка, всё понятно без переводчика.',
    en: 'Excellent language level, everything clear without an interpreter.',
  },
  nature: {
    uz: 'Cho‘l va ko‘l bo‘yidagi kunni juda yaxshi tashkil qildi.',
    ru: 'Отлично организовал день в степи и на озере.',
    en: 'Organised the steppe and lake day very well.',
  },
  group: {
    uz: 'Katta guruhni bemalol boshqardi, hech kim yo‘qolmadi.',
    ru: 'Спокойно управлял большой группой, никто не потерялся.',
    en: 'Handled a large group calmly; nobody got lost.',
  },
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

/**
 * Склонение числительных. Русский требует три формы, английский две,
 * узбекскому согласование не нужно вовсе.
 */
function ruPlural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function reviewsLabel(n: number, lang: Lang): string {
  if (lang === 'uz') return 'sharh';
  if (lang === 'en') return n === 1 ? 'review' : 'reviews';
  return ruPlural(n, ['отзыв', 'отзыва', 'отзывов']);
}

export function yearsLabel(n: number, lang: Lang): string {
  if (lang === 'uz') return 'yillik tajriba';
  if (lang === 'en') return n === 1 ? 'year of experience' : 'years of experience';
  return `${ruPlural(n, ['год', 'года', 'лет'])} опыта`;
}

/** Словарь интерфейса. Ключ -> три языка. */
export const UI = {
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

  // язык — первый вопрос: модалка перекрывает шапку, и без этого шага
  // русскоязычный или иностранец заперт в узбекском интерфейсе
  onbLang: {
    uz: 'Qaysi tilda davom etamiz?',
    ru: 'На каком языке продолжим?',
    en: 'Which language shall we continue in?',
  },
  onbInterests: {
    uz: 'Nimalarga qiziqasiz?',
    ru: 'Что вам интересно?',
    en: 'What are you interested in?',
  },
  onbRegion: {
    uz: 'Qayerga bormoqchisiz?',
    ru: 'Куда собираетесь?',
    en: 'Where are you heading?',
  },
  onbFormat: {
    uz: 'Qanday sayohat qilasiz?',
    ru: 'Как путешествуете?',
    en: 'How are you travelling?',
  },
  onbNext: { uz: 'Keyingisi', ru: 'Дальше', en: 'Next' },
  onbFinish: { uz: 'Tayyor', ru: 'Готово', en: 'Done' },
  onbSkip: { uz: 'O‘tkazib yuborish', ru: 'Пропустить', en: 'Skip' },

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
  fieldDates: { uz: 'Sayohat sanalari', ru: 'Даты поездки', en: 'Trip dates' },
  fieldDateFrom: { uz: 'dan', ru: 'с', en: 'from' },
  fieldDateTo: { uz: 'gacha', ru: 'по', en: 'to' },
  fieldRegionsHint: {
    uz: 'Bir nechta hududni tanlash mumkin',
    ru: 'Можно выбрать несколько регионов',
    en: 'You can select several regions',
  },
  fieldSummer: {
    uz: 'Yozgi sayohat (+38 dan issiq)',
    ru: 'Летняя поездка (жара выше +38)',
    en: 'Summer trip (over +38 °C)',
  },
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
  // подпись поля и надпись на кнопке — разные вещи: поле должно объяснять, что вводить
  checkFieldLabel: {
    uz: 'Gid nima dedi?',
    ru: 'Что сказал гид?',
    en: 'What did the guide say?',
  },
  checkExamplesLabel: { uz: 'Tayyor misollar:', ru: 'Готовые примеры:', en: 'Ready examples:' },
  checkLoading: { uz: 'Tekshiryapman…', ru: 'Проверяю…', en: 'Checking…' },
  checkError: {
    uz: 'Tekshirib bo‘lmadi. Yana urinib ko‘ring.',
    ru: 'Не удалось проверить. Попробуйте ещё раз.',
    en: 'Check failed. Please try again.',
  },
  voiceIdle: { uz: 'Gid nutqini yozish', ru: 'Записать речь гида', en: 'Record the guide' },
  voiceListening: { uz: 'To‘xtatish', ru: 'Остановить', en: 'Stop' },
  voiceHint: {
    uz: 'Gapiring — nutq to‘xtaguncha yozib boraman, tugatgach «To‘xtatish»ni bosing.',
    ru: 'Говорите — запись идёт непрерывно, по окончании нажмите «Остановить».',
    en: 'Speak — recording runs continuously; press “Stop” when the guide finishes.',
  },
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
  // «офлайн-режим» читалось как «у вас нет интернета»; на деле это ответ по правилам
  modeOffline: { uz: 'modelsiz, qoidalar bo‘yicha', ru: 'без модели, по правилам', en: 'rule-based, no model' },
  modeOfflineHint: {
    uz: 'Model ulanmagan: javob rasmiy manbalar va qoidalar asosida. Internet bilan bog‘liq emas.',
    ru: 'Модель не подключена: ответ собран по официальным источникам и правилам. С интернетом это не связано.',
    en: 'No model connected: the answer comes from official sources and rules. This is not about your connection.',
  },

  speakStart: { uz: 'Ovoz bilan tinglash', ru: 'Прослушать', en: 'Listen' },
  speakStop: { uz: 'To‘xtatish', ru: 'Остановить', en: 'Stop' },
  placeHighlights: {
    uz: 'Ichkarida nima bor',
    ru: 'Что посмотреть внутри',
    en: 'What to see inside',
  },
  placeFacts: {
    uz: 'Rasmiy manbalardagi faktlar',
    ru: 'Факты из официальных источников',
    en: 'Facts from official sources',
  },
  placeNoFacts: {
    uz: 'Bu obyekt bo‘yicha manbalarda ma’lumot yo‘q.',
    ru: 'По этому объекту в источниках данных нет.',
    en: 'The sources hold no data on this place.',
  },
  placeCheckHere: {
    uz: 'Shu obyekt bo‘yicha tekshirish',
    ru: 'Проверить факт об объекте',
    en: 'Check a claim about this place',
  },
  placeContext: { uz: 'Obyekt', ru: 'Объект', en: 'Place' },
  qrScan: { uz: 'QR-kodni skanerlash', ru: 'Сканировать QR', en: 'Scan QR' },
  qrStop: { uz: 'Skanerni yopish', ru: 'Закрыть сканер', en: 'Close scanner' },
  qrCameraError: {
    uz: 'Kameraga ruxsat berilmadi.',
    ru: 'Доступ к камере не получен.',
    en: 'Camera access was denied.',
  },

  transferTitle: { uz: 'Ko‘chish', ru: 'Переезд', en: 'Transfer' },
  transferPlane: { uz: 'samolyot', ru: 'самолёт', en: 'plane' },
  transferBus: { uz: 'avtobus', ru: 'автобус', en: 'bus' },
  transferTrain: { uz: 'poyezd', ru: 'поезд', en: 'train' },
  transferCar: { uz: 'mashina', ru: 'машина', en: 'car' },
  transferMinibus: { uz: 'mikroavtobus', ru: 'микроавтобус', en: 'minibus' },
  transferHours: { uz: 'soat', ru: 'ч', en: 'h' },
  transferPriceNote: {
    uz: 'Narxlar taxminiy demo-baho, tarif emas.',
    ru: 'Цены — ориентировочная демо-оценка, не тариф.',
    en: 'Prices are rough demo estimates, not tariffs.',
  },
  transferWithGuide: {
    uz: 'Transporti bor gid bu ko‘chishni o‘zi bajarishi mumkin',
    ru: 'Гид со своим транспортом может закрыть этот переезд',
    en: 'A guide with own transport can cover this leg',
  },

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
  planRebuild: { uz: 'Qayta tuzish', ru: 'Пересобрать', en: 'Rebuild' },
  planLoading: { uz: 'Marshrut yig‘ilmoqda…', ru: 'Собираю маршрут…', en: 'Building…' },
  planError: {
    uz: 'Marshrut tuzilmadi. Yana urinib ko‘ring.',
    ru: 'Не удалось построить маршрут. Попробуйте ещё раз.',
    en: 'Could not build the itinerary. Please try again.',
  },
  planTotal: { uz: 'Jami', ru: 'Итого', en: 'Summary' },
  planModeAi: { uz: 'model tuzgan', ru: 'составлено моделью', en: 'built by the model' },
  planDay: { uz: 'Kun', ru: 'День', en: 'Day' },
  planClosed: { uz: 'shu vaqtda yopiq', ru: 'в это время закрыт', en: 'closed at this hour' },
  planCost: { uz: 'Taxminiy xarajat', ru: 'Ориентировочные расходы', en: 'Estimated cost' },
  planCostTickets: { uz: 'chiptalar', ru: 'билеты', en: 'tickets' },
  planCostTransfer: { uz: 'yo‘l', ru: 'дорога', en: 'travel' },
  planCostNote: {
    uz: 'Demo baholash: turar joy, ovqat va gid ishtirok etmagan.',
    ru: 'Демо-оценка: без жилья, еды и услуг гида.',
    en: 'Demo estimate: excludes lodging, meals and guide fees.',
  },
  planMinutes: { uz: 'daq', ru: 'мин', en: 'min' },
  mapLoading: { uz: 'Xarita yuklanmoqda…', ru: 'Карта загружается…', en: 'Loading the map…' },

  routeHow: { uz: 'Qanday yetib borish', ru: 'Как добраться', en: 'Getting around' },
  legWalk: { uz: 'piyoda', ru: 'пешком', en: 'on foot' },
  legTaxi: { uz: 'taksi', ru: 'такси', en: 'taxi' },
  legKm: { uz: 'km', ru: 'км', en: 'km' },
  legM: { uz: 'm', ru: 'м', en: 'm' },

  fieldBudget: { uz: 'Kunlik budjet', ru: 'Дневной бюджет', en: 'Daily budget' },
  budgetHint: {
    uz: 'Bir kunlik taxminiy xarajat: marshrut va transfer shunga moslanadi.',
    ru: 'Ориентировочные траты за день: под них подстраиваются маршрут и переезд.',
    en: 'Roughly what you spend per day: the itinerary and transfers adapt to it.',
  },
  budgetOver: {
    uz: 'Kun budjetdan oshdi',
    ru: 'День выходит за бюджет',
    en: 'This day goes over budget',
  },
  budgetDay: { uz: 'Kun xarajati', ru: 'Траты за день', en: 'Spend for the day' },
  fieldGuideLangs: { uz: 'Muloqot tillari', ru: 'Языки общения', en: 'Languages you speak' },
  guideLangsHint: {
    uz: 'Gid tanlashda ishlatiladi — interfeys tili bilan bir xil bo‘lishi shart emas.',
    ru: 'Используется при подборе гида — это не обязательно язык интерфейса.',
    en: 'Used when matching a guide — not necessarily your interface language.',
  },

  photoCredit: { uz: 'Surat', ru: 'Фото', en: 'Photo' },
  photoSource: { uz: 'fayl sahifasi', ru: 'страница файла', en: 'file page' },
  photoNone: { uz: 'Surat yo‘q', ru: 'Фото нет', en: 'No photo' },
  photoLicense: {
    uz: 'Suratlar — Vikiombordan, erkin litsenziyalar ostida; muallif va litsenziya obyekt sahifasida ko‘rsatilgan.',
    ru: 'Фотографии — с Викисклада, под свободными лицензиями; автор и лицензия указаны на странице объекта.',
    en: 'Photos come from Wikimedia Commons under free licences; author and licence are shown on each place page.',
  },
  routeNavigator: {
    uz: 'Navigatorda ochish',
    ru: 'Открыть в навигаторе',
    en: 'Open in a navigator',
  },
  routeRoadsNote: {
    uz: 'Yo‘nalish haqiqiy yo‘llar bo‘ylab chizilgan (OSRM, OpenStreetMap ma’lumotlari).',
    ru: 'Линия проложена по настоящим дорогам (OSRM по данным OpenStreetMap).',
    en: 'The line follows real roads (OSRM over OpenStreetMap data).',
  },
  routeDirectNote: {
    uz: 'Punktir — to‘g‘ri yo‘nalish: marshrutlovchi javob bermadi, bu yo‘lning o‘zi emas.',
    ru: 'Пунктир — прямое направление: маршрутизатор не ответил, это не сам путь.',
    en: 'Dashed lines are straight bearings: the router did not answer, so this is not the path itself.',
  },

  soloTitle: {
    uz: 'Yakka sayohatchi uchun',
    ru: 'Для одиночного путешественника',
    en: 'For the solo traveller',
  },
  soloLead: {
    uz: 'Yakka sayohatda tizim tasdiqlangan gidlarni oldinga chiqaradi va quyidagilarni eslatadi.',
    ru: 'В одиночной поездке система поднимает проверенных гидов и напоминает о нескольких вещах.',
    en: 'On a solo trip the system promotes verified guides and reminds you of a few things.',
  },
  soloTip1: {
    uz: 'Marshrutingizni yaqinlaringizga yuboring — pastdagi QR orqali ulashish mumkin.',
    ru: 'Отправьте маршрут близким — им можно поделиться по QR ниже.',
    en: 'Share your itinerary with someone close — the QR below does it.',
  },
  soloTip2: {
    uz: 'Kechki sayrlar uchun yoritilgan va gavjum joylarni tanlang.',
    ru: 'Для вечерних прогулок выбирайте освещённые и людные места.',
    en: 'For evening walks pick well-lit, busy places.',
  },
  soloTip3: {
    uz: 'Gidni faqat tasdiqlangan holati bilan oling: litsenziya va reestr yozuvi kartada ko‘rinadi.',
    ru: 'Берите гида только с подтверждённым статусом: лицензия и запись в реестре видны в карточке.',
    en: 'Take a guide with confirmed status only: licence and registry entry are shown on the card.',
  },
  soloTip4: {
    uz: 'Gid aytgan faktni shubha tug‘ilsa darhol tekshiring — bu uning reytingiga ham ta’sir qiladi.',
    ru: 'Сомневаетесь в словах гида — проверьте сразу, это влияет и на его рейтинг.',
    en: 'If a guide’s claim feels off, check it right away — it also feeds their rating.',
  },
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
  guidesLanguage: { uz: 'Gid tillari', ru: 'Языки гида', en: 'Guide languages' },
  guidesGender: { uz: 'Gid jinsi', ru: 'Пол гида', en: 'Guide gender' },
  guidesTransport: { uz: 'O‘z transporti bilan', ru: 'Со своим транспортом', en: 'Has own transport' },
  guidesHasTransport: { uz: 'transporti bor', ru: 'свой транспорт', en: 'own transport' },
  guidesReviewsTitle: { uz: 'Sharhlar', ru: 'Отзывы', en: 'Reviews' },
  guidesLanguageHint: {
    uz: 'Bir nechta tilni tanlash mumkin',
    ru: 'Можно выбрать несколько языков',
    en: 'You can select several languages',
  },
  guidesLoading: { uz: 'Tanlanmoqda…', ru: 'Подбираю…', en: 'Matching…' },
  guidesEmpty: {
    uz: 'Joriy filtrlar bo‘yicha gid yo‘q — tilni yoki sayohat kontekstini o‘zgartiring.',
    ru: 'Под текущие фильтры гидов нет — измените язык или контекст поездки.',
    en: 'No guides match the current filters — change the language or the trip context.',
  },
  guidesVerified: { uz: '✓ tasdiqlangan (demo)', ru: '✓ подтверждён (демо)', en: '✓ verified (demo)' },
  guidesReviews: { uz: 'sharh', ru: 'отзывов', en: 'reviews' },
  guidesPerDay: { uz: 'kun', ru: 'день', en: 'day' },
  tabProfile: { uz: 'Profil', ru: 'Профиль', en: 'Profile' },

  homeOverline: { uz: 'O‘ZBEKISTON TURIZMI', ru: 'ТУРИЗМ УЗБЕКИСТАНА', en: 'UZBEKISTAN TRAVEL' },
  homeGreeting: {
    uz: 'Ishonchli sayohat hamrohingiz',
    ru: 'Ваш надёжный спутник в поездке',
    en: 'Your trustworthy travel companion',
  },
  homeGreetingSub: {
    uz: 'Marshrut, faktlarni tekshirish va gid — bitta kontekstda.',
    ru: 'Маршрут, проверка фактов и гид — в одном контексте.',
    en: 'Itinerary, fact checking and a guide — in one context.',
  },
  homeRecommended: { uz: 'Siz uchun tavsiya', ru: 'Рекомендуем вам', en: 'Recommended for you' },

  profileTitle: { uz: 'Profil', ru: 'Профиль', en: 'Profile' },
  profileLead: {
    uz: 'Saqlangan joylaringiz, tekshirgan faktlaringiz va sayohat sozlamalaringiz bir joyda.',
    ru: 'Сохранённые места, проверенные факты и настройки поездки — одним местом.',
    en: 'Your saved places, checked facts and trip settings in one place.',
  },
  profileStatSaved: { uz: 'Saqlangan', ru: 'Сохранено', en: 'Saved' },
  profileStatChecks: { uz: 'Tekshirilgan', ru: 'Проверок', en: 'Checks' },
  profileStatPinned: { uz: 'Marshrutda', ru: 'В маршруте', en: 'Pinned' },
  profilePrefs: {
    uz: 'Sayohat preferensiyalarim',
    ru: 'Настройки поездки',
    en: 'My trip preferences',
  },
  profileFindMore: { uz: 'obyektlarni ko‘rish', ru: 'смотреть объекты', en: 'browse places' },
  profileChecks: {
    uz: 'Oxirgi tekshiruvlar',
    ru: 'Последние проверки',
    en: 'Recent fact checks',
  },
  profileChecksEmpty: {
    uz: 'Hali hech narsa tekshirilmagan.',
    ru: 'Пока ничего не проверено.',
    en: 'Nothing checked yet.',
  },
  profileCheckMore: { uz: 'faktni tekshirish', ru: 'проверить факт', en: 'check a fact' },
  planDaysShort: { uz: 'kun', ru: 'дн.', en: 'days' },

  mapPois: { uz: 'Infratuzilma', ru: 'Инфраструктура', en: 'Amenities' },
  mapPoisHint: {
    uz: 'Zapravka, hojatxona, namozxona, tibbiy punkt va kafe — xaritada.',
    ru: 'Заправки, туалеты, намазхона, медпункт и кафе — на карте.',
    en: 'Fuel, toilets, prayer rooms, clinics and cafes on the map.',
  },

  dayDuration: { uz: 'Kun', ru: 'День', en: 'Day' },
  dayDurationHint: {
    uz: 'Ko‘rish vaqti va obyektlar orasidagi yo‘l qo‘shilgan.',
    ru: 'Время осмотра плюс дорога между объектами.',
    en: 'Sightseeing time plus travel between the places.',
  },
  tripCountdown: {
    uz: 'Sayohatgacha',
    ru: 'До поездки',
    en: 'Until your trip',
  },
  tripToday: { uz: 'Sayohat bugun boshlanadi', ru: 'Поездка начинается сегодня', en: 'Your trip starts today' },
  tripDaysLeft: { uz: 'kun', ru: 'дн.', en: 'days' },

  windLabel: { uz: 'Shamol', ru: 'Ветер', en: 'Wind' },
  windUnit: { uz: 'km/soat', ru: 'км/ч', en: 'km/h' },
  windDust: { uz: 'shamolli', ru: 'ветрено', en: 'windy' },
  windDustHint: {
    uz: 'Kuchli shamol: ochiq maydonlarda chang ko‘tariladi.',
    ru: 'Сильный ветер: на открытых площадках поднимается пыль.',
    en: 'Strong wind: dust picks up on open squares.',
  },

  officialFacts: {
    uz: 'Rasmiy manbalardan',
    ru: 'Из официальных источников',
    en: 'From official sources',
  },
  officialShort: { uz: 'Rasmiy manba', ru: 'Официальный источник', en: 'Official source' },
  officialOf: { uz: 'tadan', ru: 'из', en: 'of' },
  officialHint: {
    uz: 'Bu obyekt haqidagi faktlarning nechtasi rasmiy manbalardan olingan: YUNESKO, vazirliklar, muzeylar.',
    ru: 'Сколько фактов об объекте взято из официальных источников: ЮНЕСКО, министерства, музеи.',
    en: 'How many facts about this place come from official sources: UNESCO, ministries, museums.',
  },

  saveAdd: { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  savedAdded: { uz: 'Saqlangan', ru: 'Сохранено', en: 'Saved' },
  savedTitle: { uz: 'Saqlangan joylar', ru: 'Сохранённые места', en: 'Saved places' },
  savedEmpty: {
    uz: 'Hali hech narsa saqlanmagan. Obyekt sahifasida «Saqlash» tugmasini bosing.',
    ru: 'Пока ничего не сохранено. Нажмите «Сохранить» на странице объекта.',
    en: 'Nothing saved yet. Press “Save” on a place page.',
  },

  verdictOnMap: { uz: 'Xaritada ko‘rish', ru: 'Показать на карте', en: 'Show on the map' },
  verdictSave: {
    uz: 'Marshrutga saqlash',
    ru: 'Сохранить в маршрут',
    en: 'Save to my itinerary',
  },
  verdictSaved: { uz: 'Marshrutda', ru: 'В маршруте', en: 'In your itinerary' },
  verdictOpenPlan: { uz: 'marshrutni ochish', ru: 'открыть маршрут', en: 'open the itinerary' },

  suggestAge: { uz: 'Qachon qurilgan?', ru: 'Когда построен?', en: 'When was it built?' },
  suggestGuideSaid: { uz: 'Gid shunday dedi…', ru: 'Гид сказал…', en: 'The guide said…' },
  suggestHeight: { uz: 'Bu ma’lumot to‘g‘rimi?', ru: 'Верна ли эта информация?', en: 'Is this correct?' },

  guidesSearch: {
    uz: 'Gid, shahar, til yoki yo‘nalish bo‘yicha qidiring…',
    ru: 'Поиск по гиду, городу, языку или направлению…',
    en: 'Search by guide, city, language or specialisation…',
  },
  guidesSort: { uz: 'Saralash', ru: 'Сортировка', en: 'Sort by' },
  sortMatch: { uz: 'moslik bo‘yicha', ru: 'по совпадению', en: 'best match' },
  sortAccuracy: { uz: 'aniqlik bo‘yicha', ru: 'по точности фактов', en: 'fact accuracy' },
  sortPrice: { uz: 'narx bo‘yicha', ru: 'по цене', en: 'price' },
  sortExperience: { uz: 'tajriba bo‘yicha', ru: 'по опыту', en: 'experience' },
  guidesFound: { uz: 'Topildi', ru: 'Найдено', en: 'Found' },
  guidesVerifiedCount: { uz: 'tasdiqlangan', ru: 'подтверждённых', en: 'verified' },
  guidesWithinBudget: {
    uz: 'Budjetim doirasida',
    ru: 'В рамках моего бюджета',
    en: 'Within my budget',
  },
  guidesAboveBudget: {
    uz: 'budjetdan qimmat',
    ru: 'дороже вашего бюджета',
    en: 'above your budget',
  },
  guidesHiddenByBudget: {
    uz: 'Budjetdan qimmatroq gidlarni ko‘rsatish',
    ru: 'Показать гидов дороже бюджета',
    en: 'Show guides above my budget',
  },
  guidesClearSearch: { uz: 'Qidiruvni tozalash', ru: 'Очистить поиск', en: 'Clear the search' },
  guidesClearTransport: {
    uz: 'Transport shartini olib tashlash',
    ru: 'Снять условие «свой транспорт»',
    en: 'Drop the “own transport” filter',
  },
  guidesYears: { uz: 'yillik tajriba', ru: 'лет опыта', en: 'years of experience' },
  guidesByPlace: {
    uz: 'Obyektlar bo‘yicha aniqlik',
    ru: 'Точность по объектам',
    en: 'Accuracy by place',
  },
  nearbyTitle: {
    uz: 'Yaqin atrofda',
    ru: 'Рядом по маршруту',
    en: 'Nearby on the route',
  },
  nearbyHint: {
    uz: 'Zapravka, hojatxona, namozxona, tibbiy punkt va kafe',
    ru: 'Заправки, туалеты, намазхона, медпункт и кафе',
    en: 'Fuel, toilets, prayer room, clinic and cafe',
  },
  guidesWhy: { uz: 'Nega u', ru: 'Почему он', en: 'Why this guide' },
  verifyTitle: {
    uz: 'Nima tekshirilgan',
    ru: 'Что проверено',
    en: 'What was verified',
  },
  verifyLicense: { uz: 'Litsenziya', ru: 'Лицензия', en: 'Licence' },
  verifyRegistry: { uz: 'Qo‘mita reestrida', ru: 'В реестре Комитета', en: 'In the Committee registry' },
  verifyIdentity: { uz: 'Shaxsi tasdiqlangan', ru: 'Личность подтверждена', en: 'Identity confirmed' },
  verifyLanguages: { uz: 'Til darajasi tekshirilgan', ru: 'Уровень языков проверен', en: 'Language level checked' },
  verifyDate: { uz: 'Tekshiruv sanasi', ru: 'Дата проверки', en: 'Checked on' },
  verifyNone: {
    uz: 'Tekshirilmagan: reestr ma’lumotlari yo‘q. Gid xizmatidan ehtiyot bo‘lib foydalaning.',
    ru: 'Не проверен: данных реестра нет. Пользуйтесь услугами такого гида осмотрительно.',
    en: 'Not verified: no registry data. Use such a guide with caution.',
  },
  verifyDemoNote: {
    uz: 'Prototipda tekshiruv ma’lumotlari demo; ishchi versiyada Turizm qo‘mitasi reestriga ulanadi.',
    ru: 'В прототипе данные проверки демонстрационные; в рабочей версии подключается реестр Комитета по туризму.',
    en: 'Verification data is demo here; production connects the Tourism Committee registry.',
  },
  guidesAccuracy: {
    uz: 'Faktlar aniqligi',
    ru: 'Точность фактов',
    en: 'Fact accuracy',
  },
  guidesAccuracyHint: {
    uz: 'Ilova tekshirgan gaplari asosida',
    ru: 'По утверждениям, проверенным в приложении',
    en: 'Based on claims verified in the app',
  },
  // ★ и «точность фактов» — разные вещи, и в этом вся идея продукта
  guidesTwoScores: {
    uz: '★ — turistlar qo‘ygan baho. «Faktlar aniqligi» — gid gaplarining rasmiy manbalar bilan tasdiqlangan ulushi.',
    ru: '★ — оценка туристов. «Точность фактов» — доля утверждений гида, подтверждённых официальными источниками.',
    en: '★ is the tourists’ rating. “Fact accuracy” is the share of the guide’s claims confirmed by official sources.',
  },
  guidesWhyMore: { uz: 'yana sabablar', ru: 'ещё причины', en: 'more reasons' },
  // до порога процент не показываем: «100% по одной проверке» — это ложь, а не оценка
  guidesFewChecks: {
    uz: 'Tekshiruv kam — aniqlik hali hisoblanmaydi',
    ru: 'Проверок мало — точность пока не считается',
    en: 'Too few checks — accuracy not counted yet',
  },
  checkDuplicate: {
    uz: 'Bu gap allaqachon hisobga olingan — takrori reytingga qo‘shilmaydi',
    ru: 'Это утверждение уже учтено — повтор в рейтинг не идёт',
    en: 'This claim is already counted — repeats do not affect the rating',
  },
  checkRateLimited: {
    uz: 'Juda ko‘p tekshiruv — reyting vaqtincha yangilanmaydi',
    ru: 'Слишком много проверок подряд — рейтинг временно не обновляется',
    en: 'Too many checks in a row — the rating is paused for now',
  },
  checkWhoSaid: {
    uz: 'Kimning gapi tekshirilyapti?',
    ru: 'Чьё утверждение проверяем?',
    en: 'Whose claim is this?',
  },
  checkWhoSaidHint: {
    uz: 'Gidni tanlasangiz, natija uning faktlar aniqligiga qo‘shiladi. Tanlamasangiz ham tekshiruv ishlaydi.',
    ru: 'Если выбрать гида, результат попадёт в его точность фактов. Без выбора проверка тоже работает.',
    en: 'Pick a guide and the verdict counts towards their fact accuracy. The check works without picking, too.',
  },
  checkNoGuide: { uz: 'ko‘rsatilmagan', ru: 'не указан', en: 'not specified' },
  checkCounted: {
    uz: 'Natija gid reytingiga qo‘shildi',
    ru: 'Результат учтён в рейтинге гида',
    en: 'The result was added to the guide’s rating',
  },

  authLogin: { uz: 'Kirish', ru: 'Войти', en: 'Sign in' },
  authRegister: { uz: 'Ro‘yxatdan o‘tish', ru: 'Регистрация', en: 'Sign up' },
  authLogout: { uz: 'Chiqish', ru: 'Выйти', en: 'Sign out' },
  authEmail: { uz: 'Email', ru: 'Email', en: 'Email' },
  authPassword: { uz: 'Parol', ru: 'Пароль', en: 'Password' },
  authHaveAccount: {
    uz: 'Akkountingiz bormi? Kiring',
    ru: 'Уже есть аккаунт? Войти',
    en: 'Already have an account? Sign in',
  },
  authNoAccount: {
    uz: 'Akkount yo‘qmi? Ro‘yxatdan o‘ting',
    ru: 'Нет аккаунта? Зарегистрируйтесь',
    en: 'No account? Sign up',
  },
  authInvalid: {
    uz: 'Email yoki parol noto‘g‘ri.',
    ru: 'Неверный email или пароль.',
    en: 'Wrong email or password.',
  },
  authTaken: {
    uz: 'Bunday email band yoki ma’lumot noto‘g‘ri.',
    ru: 'Такой email занят или данные неверны.',
    en: 'That email is taken or the data is invalid.',
  },
  authWeak: {
    uz: 'Parol kamida 6 belgidan iborat bo‘lsin.',
    ru: 'Пароль должен быть не короче 6 символов.',
    en: 'The password must be at least 6 characters.',
  },
  authTooMany: {
    uz: 'Juda ko‘p urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring.',
    ru: 'Слишком много попыток. Попробуйте через 15 минут.',
    en: 'Too many attempts. Try again in 15 minutes.',
  },
  authForbidden: {
    uz: 'Bu bo‘limga faqat administrator kiradi.',
    ru: 'В этот раздел заходит только администратор.',
    en: 'This section is for administrators only.',
  },
  authDemoHint: {
    uz: 'Demo administrator: admin@nexus30.uz / nexus30',
    ru: 'Демо-администратор: admin@nexus30.uz / nexus30',
    en: 'Demo administrator: admin@nexus30.uz / nexus30',
  },

  adminTitle: { uz: 'Boshqaruv paneli', ru: 'Панель управления', en: 'Admin panel' },
  adminLead: {
    uz: 'Prototip ma’lumotlari xotirada saqlanadi: o‘zgarishlar server qayta ishga tushguncha amal qiladi. JSON eksporti orqali ko‘chirib olinadi.',
    ru: 'Данные прототипа живут в памяти: правки действуют до перезапуска сервера. Перенести их можно экспортом JSON.',
    en: 'Prototype data lives in memory: edits last until the server restarts. Export JSON to carry them over.',
  },
  adminGuides: { uz: 'Gidlar', ru: 'Гиды', en: 'Guides' },
  adminFacts: { uz: 'Manba faktlari', ru: 'Факты источников', en: 'Source facts' },
  adminUsers: { uz: 'Foydalanuvchilar', ru: 'Пользователи', en: 'Users' },

  // Отчёт Комитету: побочный продукт проверок, которого у заказчика сегодня нет
  adminReport: { uz: 'Hisobot', ru: 'Отчёт', en: 'Report' },
  adminRequests: { uz: 'Murojaatlar', ru: 'Заявки', en: 'Requests' },
  adminGuideAccess: { uz: 'Kirish berish', ru: 'Выдать доступ', en: 'Grant access' },
  adminGuideAccessDone: {
    uz: 'Kirish yaratildi — parolni gidga bering, u boshqa ko‘rsatilmaydi:',
    ru: 'Доступ создан — передайте пароль гиду, второй раз он не покажется:',
    en: 'Access created — pass the password to the guide, it will not be shown again:',
  },

  // сторона гида
  guidePanelTitle: { uz: 'Mening kabinetim', ru: 'Мой кабинет', en: 'My dashboard' },
  guidePanelFewHint: {
    uz: 'Aniqlik {n} tadan kam tekshiruvda hisoblanmaydi va turistlarga ko‘rsatilmaydi.',
    ru: 'Точность не считается и не показывается туристам, пока проверок меньше порога.',
    en: 'Accuracy is neither counted nor shown to tourists until the threshold is reached.',
  },
  guidePanelVerdicts: {
    uz: 'Sizga tegishli tekshiruvlar',
    ru: 'Проверки, засчитанные вам',
    en: 'Checks counted against you',
  },
  guidePanelEmpty: {
    uz: 'Hali tekshiruvlar yo‘q.',
    ru: 'Проверок пока нет.',
    en: 'No checks yet.',
  },
  guidePanelDispute: { uz: 'E’tiroz bildirish', ru: 'Оспорить', en: 'Dispute' },
  guidePanelDisputeSend: { uz: 'Yuborish', ru: 'Отправить', en: 'Send' },
  guidePanelDisputed: { uz: 'E’tiroz yuborilgan', ru: 'Оспорено', en: 'Disputed' },
  guidePanelDisputePlaceholder: {
    uz: 'Nima uchun rozimassiz? Manba yoki izoh keltiring.',
    ru: 'Почему вы не согласны? Приведите источник или пояснение.',
    en: 'Why do you disagree? Cite a source or explain.',
  },

  // входящий ящик
  reqDisputes: { uz: 'Gidlar e’tirozi', ru: 'Возражения гидов', en: 'Guide disputes' },
  reqIncoming: { uz: 'Turistlar murojaati', ru: 'Заявки от туристов', en: 'Tourist requests' },
  reqEmpty: { uz: 'Bo‘sh.', ru: 'Пусто.', en: 'Nothing here.' },
  reqUphold: { uz: 'E’tirozni qabul qilish', ru: 'Удовлетворить', en: 'Uphold' },
  reqReject: { uz: 'Rad etish', ru: 'Отклонить', en: 'Reject' },
  reqUpheld: { uz: 'Qabul qilindi — hisobdan chiqarildi', ru: 'Удовлетворено — снято со счёта', en: 'Upheld — removed from the count' },
  reqRejected: { uz: 'Rad etildi', ru: 'Отклонено', en: 'Rejected' },
  reqProblem: { uz: 'Obyektdagi muammo', ru: 'Проблема на объекте', en: 'Problem at a site' },
  reqBooking: { uz: 'Gid so‘rovi', ru: 'Запрос гида', en: 'Guide request' },
  reqDone: { uz: 'Ko‘rib chiqilgan', ru: 'Обработано', en: 'Handled' },
  reqMarkDone: { uz: 'Ko‘rib chiqildi', ru: 'Отметить обработанным', en: 'Mark handled' },

  // формы заявок
  // Экстренные номера: одиночке в чужой стране нужнее любого совета
  sosTitle: { uz: 'Favqulodda raqamlar', ru: 'Экстренные номера', en: 'Emergency numbers' },
  sosUnified: { uz: 'Yagona', ru: 'Единый', en: 'Unified' },
  sosPolice: { uz: 'Militsiya', ru: 'Милиция', en: 'Police' },
  sosAmbulance: { uz: 'Tez yordam', ru: 'Скорая', en: 'Ambulance' },
  sosTourism: { uz: 'Turizm qo‘llab-quvvatlash', ru: 'Поддержка туристов', en: 'Tourist support' },

  planIcs: { uz: 'Kalendarga qo‘shish', ru: 'В календарь', en: 'Add to calendar' },

  // Темп поездки — ещё одна ось персонализации, отдельная от формата
  fieldPace: { uz: 'Sur’at', ru: 'Темп', en: 'Pace' },
  paceRelaxed: { uz: 'sokin', ru: 'спокойный', en: 'relaxed' },
  paceNormal: { uz: 'odatiy', ru: 'обычный', en: 'normal' },
  pacePacked: { uz: 'jadal', ru: 'насыщенный', en: 'packed' },
  paceHint: {
    uz: 'Kuniga qancha ko‘rish: 4, 5,5 yoki 7 soat.',
    ru: 'Сколько осмотра в день: 4, 5,5 или 7 часов.',
    en: 'Sightseeing per day: 4, 5.5 or 7 hours.',
  },

  // Ручная правка маршрута
  planExclude: { uz: 'Olib tashlash', ru: 'Убрать', en: 'Remove' },
  planPin: { uz: 'Albatta qoldirish', ru: 'Обязательно', en: 'Must-see' },
  planPinned: { uz: 'albatta', ru: 'обязательно', en: 'must-see' },
  planExcludedTitle: { uz: 'Olib tashlangan obyektlar', ru: 'Убранные объекты', en: 'Removed places' },
  planRestore: { uz: 'Qaytarish', ru: 'Вернуть', en: 'Restore' },

  // Каталог объектов
  tabPlaces: { uz: 'Obyektlar', ru: 'Объекты', en: 'Places' },
  placesTitle: { uz: 'Barcha obyektlar', ru: 'Все объекты', en: 'All places' },
  placesLead: {
    uz: 'Katalogda qidiring yoki hududga ko‘ra saralang. Har bir obyekt kartasida faktlar va yaqin atrofdagi infratuzilma bor.',
    ru: 'Ищите по каталогу или отберите по региону. В карточке объекта — факты и инфраструктура рядом.',
    en: 'Search the catalogue or filter by region. Each card holds facts and nearby infrastructure.',
  },
  placesSearch: { uz: 'Obyekt nomi bo‘yicha qidirish', ru: 'Поиск по названию', en: 'Search by name' },
  placesEmpty: { uz: 'Hech narsa topilmadi.', ru: 'Ничего не нашлось.', en: 'Nothing found.' },
  placesAccessible: { uz: 'aravacha uchun qulay', ru: 'доступно на коляске', en: 'wheelchair accessible' },

  // История проверок
  checkHistoryTitle: { uz: 'Mening tekshiruvlarim', ru: 'Мои проверки', en: 'My checks' },
  checkHistoryEmpty: { uz: 'Hali tekshiruv yo‘q.', ru: 'Проверок пока нет.', en: 'No checks yet.' },
  checkHistoryClear: { uz: 'Tozalash', ru: 'Очистить', en: 'Clear' },
  checkHistoryHint: {
    uz: 'Tarix faqat shu qurilmada saqlanadi va internetsiz ham ochiladi.',
    ru: 'История хранится только на этом устройстве и открывается без интернета.',
    en: 'History stays on this device and opens without a connection.',
  },

  // Печать маршрута
  planPrint: { uz: 'Chop etish', ru: 'Распечатать', en: 'Print' },

  // Голосовой ввод контекста поездки
  voiceTripHint: {
    uz: 'Aytib bering: «Samarqandga uch kunga, tarix qiziq».',
    ru: 'Скажите: «в Самарканд на три дня, интересует история».',
    en: 'Say: “Samarkand for three days, interested in history”.',
  },
  voiceTripNothing: {
    uz: 'Tushunarli parametr topilmadi — qo‘lda tanlang.',
    ru: 'Понятных параметров не нашлось — выберите вручную.',
    en: 'Nothing recognised — pick the options by hand.',
  },

  // Качество источника: ЮНЕСКО и туристический портал — не одно и то же
  sourceOfficial: { uz: 'rasmiy manba', ru: 'официальный источник', en: 'official source' },
  sourceSecondary: { uz: 'ikkilamchi manba', ru: 'вторичный источник', en: 'secondary source' },

  skipToContent: { uz: 'Asosiy qismga o‘tish', ru: 'К содержимому', en: 'Skip to content' },

  // Офлайн-пакет: прогреть карту, пока сеть есть, а не когда её уже нет
  offlinePack: { uz: 'Xaritani oldindan yuklash', ru: 'Скачать карту заранее', en: 'Download the map' },
  offlinePackBusy: { uz: 'Yuklanmoqda…', ru: 'Скачиваю…', en: 'Downloading…' },
  offlinePackHint: {
    uz: 'Tanlangan hudud xaritasi telefonda qoladi: internet yo‘qolsa ham marshrut ochiladi.',
    ru: 'Карта выбранного региона останется на телефоне: маршрут откроется, даже если сеть пропадёт.',
    en: 'The selected region’s map stays on your phone: the itinerary opens even without a connection.',
  },

  // Намаз: для зиёрат-туризма важно не только «где намазхона», но и «когда»
  prayerTitle: { uz: 'Namoz vaqtlari', ru: 'Время намаза', en: 'Prayer times' },
  prayerFajr: { uz: 'Bomdod', ru: 'Фаджр', en: 'Fajr' },
  prayerDhuhr: { uz: 'Peshin', ru: 'Зухр', en: 'Dhuhr' },
  prayerAsr: { uz: 'Asr', ru: 'Аср', en: 'Asr' },
  prayerMaghrib: { uz: 'Shom', ru: 'Магриб', en: 'Maghrib' },
  prayerIsha: { uz: 'Xufton', ru: 'Иша', en: 'Isha' },
  prayerNote: {
    uz: 'quyosh bo‘yicha hisoblangan, aniq vaqt — mahalliy masjid jadvalida',
    ru: 'расчёт по солнцу, точное время — в расписании местной мечети',
    en: 'computed from the sun; the local mosque schedule is authoritative',
  },

  // Погода: источник всегда подписан — прогноз и норма это разные вещи
  weatherForecast: { uz: 'prognoz', ru: 'прогноз', en: 'forecast' },
  weatherNorm: { uz: 'iqlim normasi', ru: 'норма', en: 'climate norm' },
  weatherForecastHint: {
    uz: 'Marshrut kunidagi shahar bo‘yicha haqiqiy prognoz.',
    ru: 'Реальный прогноз по городу этого дня маршрута.',
    en: 'A real forecast for the city of this day.',
  },
  weatherNormHint: {
    uz: 'Prognoz olinmadi: oyning ko‘p yillik o‘rtachasi ko‘rsatilgan.',
    ru: 'Прогноз получить не удалось: показана многолетняя норма месяца.',
    en: 'No forecast available: showing the long-term monthly norm.',
  },

  // Спорные темы: у части утверждений нет одного «верно»
  disputedTitle: {
    uz: 'Manbalar bir-biriga zid',
    ru: 'Источники расходятся',
    en: 'Sources disagree',
  },
  disputedPosition: { uz: 'Versiya', ru: 'Версия', en: 'Position' },
  disputedNotCounted: {
    uz: 'Bunday holat gid reytingiga yozilmaydi: manbalar kelisha olmagan bo‘lsa, gidning aybi yo‘q.',
    ru: 'Такой случай не идёт в рейтинг гида: если источники не сошлись, вины гида здесь нет.',
    en: 'This does not count against the guide: when the sources disagree, it is not the guide’s fault.',
  },

  // Границы прототипа: без этой страницы жюри домысливает их само
  howTitle: {
    uz: 'Bu qanday joriy etiladi',
    ru: 'Как это внедряется',
    en: 'How this gets deployed',
  },
  howLead: {
    uz: 'Prototipda nima demo, nima tashqaridan olinadi va Qo‘mitadan nima kerak.',
    ru: 'Что в прототипе демонстрационное, что берётся снаружи и что нужно от Комитета.',
    en: 'What is demo data here, what comes from outside, and what the Committee needs to provide.',
  },
  howTableTitle: { uz: 'Hozir va ishchi versiyada', ru: 'Сейчас и в рабочей версии', en: 'Now and in production' },
  howColNow: { uz: 'Prototipda', ru: 'В прототипе', en: 'In the prototype' },
  howColProd: { uz: 'Ishchi versiyada', ru: 'В рабочей версии', en: 'In production' },
  howDataNow: { uz: '31 ta obyekt qo‘lda kiritilgan', ru: '31 объект, заведены вручную', en: '31 sites, entered by hand' },
  howDataProd: {
    uz: 'Qo‘mitaning obyektlar bazasi API orqali',
    ru: 'База объектов Комитета по API',
    en: 'The Committee’s site registry over an API',
  },
  howGuidesNow: { uz: '10 ta gid, «tasdiqlangan» belgisi — demo', ru: '10 гидов, метка «подтверждён» — демо', en: '10 guides, the “verified” badge is demo' },
  howGuidesProd: {
    uz: 'Qo‘mita reestri: litsenziya, shaxs va til tekshiruvi',
    ru: 'Реестр Комитета: лицензия, личность и проверка языков',
    en: 'The Committee registry: licence, identity and language checks',
  },
  howFactsNow: { uz: '40 abzas rasmiy manbalardan', ru: '40 абзацев из официальных источников', en: '40 paragraphs from official sources' },
  howFactsProd: {
    uz: 'Muzeylar va arxivlarning rasmiy matnlari, versiyalari bilan',
    ru: 'Официальные тексты музеев и архивов с версионированием',
    en: 'Official museum and archive texts, versioned',
  },
  howAiNow: { uz: 'Kalitsiz — qoidalar va oldindan yozilgan javoblar', ru: 'Без ключа — правила и предзаписанные ответы', en: 'Without a key — rules and pre-recorded answers' },
  howAiProd: {
    uz: 'Model qo‘shiladi, qoidalar zaxira yo‘l bo‘lib qoladi',
    ru: 'Подключается модель, правила остаются запасным путём',
    en: 'A model is connected; the rules remain the fallback',
  },
  howStoreNow: { uz: 'Ma’lumotlar jarayon xotirasida', ru: 'Данные в памяти процесса', en: 'Data lives in process memory' },
  howStoreProd: {
    uz: 'Ma’lumotlar bazasi: store.ts o‘rnini almashtirish yetadi',
    ru: 'База данных: достаточно заменить реализацию store.ts',
    en: 'A database: only the store.ts implementation changes',
  },
  howStepsTitle: { uz: 'Qo‘mitadan nima kerak', ru: 'Что нужно от Комитета', en: 'What the Committee needs to provide' },
  howStep1: {
    uz: 'Obyektlar bazasiga kirish: nom, joylashuv, ish vaqti, chipta narxi.',
    ru: 'Доступ к базе объектов: название, координаты, часы работы, цена билета.',
    en: 'Access to the site registry: name, coordinates, opening hours, ticket price.',
  },
  howStep2: {
    uz: 'Gidlar reestri va tasdiqlash mezonlari — TZning §9 bandi.',
    ru: 'Реестр гидов и критерии подтверждения — пункт §9 ТЗ.',
    en: 'The guide registry and verification criteria — clause §9 of the brief.',
  },
  howStep3: {
    uz: 'Rasmiy matnlar manbasi: kim yozadi va kim yangilaydi.',
    ru: 'Источник официальных текстов: кто пишет и кто обновляет.',
    en: 'A source of official texts: who writes them and who keeps them current.',
  },
  howStep4: {
    uz: 'Gidlar e’tirozini kim ko‘rib chiqadi — bu odam kerak, kod emas.',
    ru: 'Кто разбирает возражения гидов — здесь нужен человек, а не код.',
    en: 'Who reviews guide disputes — this needs a person, not code.',
  },
  howPrivacy: {
    uz: 'Maxfiylik: sayohat konteksti faqat brauzerda saqlanadi, geolokatsiya so‘ralmaydi, tekshiruvlar qurilma identifikatoriga bog‘lanadi — shaxsga emas.',
    ru: 'Приватность: контекст поездки хранится только в браузере, геолокация не запрашивается, проверки привязаны к идентификатору устройства, а не к личности.',
    en: 'Privacy: the trip context stays in the browser, no geolocation is requested, and checks are tied to a device identifier rather than a person.',
  },
  howQrTitle: { uz: 'Obyektlar uchun QR varaqasi', ru: 'Лист QR-кодов для объектов', en: 'QR sheet for the sites' },
  howQrHint: {
    uz: 'Chop eting va obyekt kiraverishiga yopishtiring: turist skanerlaydi va faktlarni tekshirish sahifasiga tushadi. Manzil so‘rovdan olinadi, shuning uchun kodlar joriy manzilga ishlaydi.',
    ru: 'Распечатайте и наклейте у входа на объект: турист сканирует и попадает на карточку с проверкой фактов. Адрес берётся из запроса, поэтому коды ведут на текущий адрес, а не на localhost.',
    en: 'Print and post at each site entrance: a tourist scans it and lands on the fact-check card. The address comes from the request, so the codes point at the current host, not localhost.',
  },
  howQrOpen: { uz: 'QR varaqasini ochish', ru: 'Открыть лист QR', en: 'Open the QR sheet' },

  // Сравнение форматов: разницу проще показать, чем объяснить словами
  tabCompare: { uz: 'Taqqoslash', ru: 'Сравнение', en: 'Compare' },
  compareTitle: {
    uz: 'Yakka, oila va guruh — yonma-yon',
    ru: 'Соло, семья и группа — рядом',
    en: 'Solo, family and group — side by side',
  },
  compareLead: {
    uz: 'Bir xil hudud, qiziqish va kunlar. Farq faqat sayohat formatida.',
    ru: 'Один и тот же регион, интересы и число дней. Отличается только формат поездки.',
    en: 'Same region, interests and number of days. Only the travel format differs.',
  },
  compareCurrent: { uz: 'hozirgi', ru: 'сейчас', en: 'current' },
  compareTake: { uz: 'Shu variantni olish', ru: 'Взять этот вариант', en: 'Take this one' },
  compareWhySolo: {
    uz: 'Yakka sayohatchiga foto nuqtalari qo‘shiladi va tasdiqlangan gidlar oldinga chiqadi.',
    ru: 'Одиночке добавляются фототочки, а проверенные гиды поднимаются выше.',
    en: 'Solo travellers get photo spots, and verified guides rank higher.',
  },
  compareWhyFamily: {
    uz: 'Oila uchun bolalarga mos bo‘lmagan obyektlar umuman taklif qilinmaydi.',
    ru: 'Для семьи объекты без условий для детей не предлагаются вовсе.',
    en: 'For families, sites without child-friendly conditions are excluded entirely.',
  },
  compareWhyGroup: {
    uz: 'Guruhda qisqa obyektlar ustun: yigirma kishi uzoqroq yig‘iladi.',
    ru: 'В группе приоритет коротким объектам: двадцать человек дольше собираются.',
    en: 'Groups favour shorter stops: twenty people take longer to gather.',
  },
  compareNote: {
    uz: 'Nuqta bilan belgilanganlar — uchala variantda ham bor. To‘q rangdagilar — shu formatga xos.',
    ru: 'Приглушённые есть во всех трёх вариантах. Яркие — то, что появилось именно в этом формате.',
    en: 'Muted entries appear in all three. Highlighted ones are specific to this format.',
  },

  reportProblem: { uz: 'Obyekt haqida xabar berish', ru: 'Сообщить о проблеме', en: 'Report a problem' },
  reportProblemHint: {
    uz: 'Yopiq, ta’mirda, narx aldovi — Qo‘mitaga yetkazamiz.',
    ru: 'Закрыто, ремонт, обман с ценой — передадим Комитету.',
    en: 'Closed, under repair, price scam — we pass it to the Committee.',
  },
  bookGuide: { uz: 'Gidni so‘rash', ru: 'Запросить гида', en: 'Request this guide' },
  bookGuideHint: {
    uz: 'Aloqangizni qoldiring — so‘rov gidga va Qo‘mitaga tushadi.',
    ru: 'Оставьте контакт — запрос уйдёт гиду и в Комитет.',
    en: 'Leave a contact — the request goes to the guide and the Committee.',
  },
  formContact: { uz: 'Telefon yoki email', ru: 'Телефон или email', en: 'Phone or email' },
  formMessage: { uz: 'Xabar', ru: 'Сообщение', en: 'Message' },
  formSend: { uz: 'Yuborish', ru: 'Отправить', en: 'Send' },
  formSent: { uz: 'Yuborildi — rahmat!', ru: 'Отправлено — спасибо!', en: 'Sent — thank you!' },
  reportLead: {
    uz: 'Turistlar gidlarning gaplarini tekshirar ekan, tizim qaysi obyektlar atrofida noto‘g‘ri ma’lumot ko‘p tarqalishini to‘playdi. Bu gidga baho emas — bu rasmiy ma’lumot yetishmayotgan joylar xaritasi.',
    ru: 'Пока туристы проверяют слова гидов, система накапливает, вокруг каких объектов чаще всего звучит недостоверное. Это не оценка гида — это карта мест, где не хватает официальной информации.',
    en: 'While tourists verify what guides say, the system accumulates which sites attract the most inaccurate claims. This is not a rating of any guide — it is a map of where official information is missing.',
  },
  reportChecks: { uz: 'Tekshiruvlar', ru: 'Проверок', en: 'Checks' },
  reportRefuted: { uz: 'Rad etilgan', ru: 'Опровергнуто', en: 'Refuted' },
  reportPlaces: { uz: 'Obyektlar', ru: 'Объектов', en: 'Sites' },
  reportEmpty: {
    uz: 'Hali tekshiruvlar yo‘q. «Faktlarni tekshirish»da gidni tanlab bir nechta gapni tekshiring.',
    ru: 'Проверок пока нет. Проверьте несколько утверждений на «Проверке фактов», указав гида.',
    en: 'No checks yet. Verify a few claims on the fact-check page with a guide selected.',
  },
  reportTableTitle: {
    uz: 'Rad etish ulushi bo‘yicha obyektlar',
    ru: 'Объекты по доле опровержений',
    en: 'Sites by share of refuted claims',
  },
  reportColPlace: { uz: 'Obyekt', ru: 'Объект', en: 'Site' },
  reportColChecks: { uz: 'Tekshiruv', ru: 'Проверок', en: 'Checks' },
  reportColRefuted: { uz: 'Rad etilgan', ru: 'Опровергнуто', en: 'Refuted' },
  reportColShare: { uz: 'Ulush', ru: 'Доля', en: 'Share' },
  reportNote: {
    uz: 'Ma’lumotlar demo. Ishchi versiyada bu hisobot Qo‘mitaga qaysi obyekt bo‘yicha rasmiy matnni yangilash kerakligini ko‘rsatadi.',
    ru: 'Данные демонстрационные. В рабочей версии этот отчёт показывает Комитету, по каким объектам пора обновить официальные материалы.',
    en: 'Demo data. In production this report tells the Committee which sites need their official materials refreshed.',
  },
  adminExport: { uz: 'JSON eksport', ru: 'Экспорт JSON', en: 'Export JSON' },
  adminVerifyOn: { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Verify' },
  adminVerifyOff: { uz: 'Tasdiqni olib tashlash', ru: 'Снять подтверждение', en: 'Unverify' },
  adminDelete: { uz: 'O‘chirish', ru: 'Удалить', en: 'Delete' },
  adminAddFact: { uz: 'Fakt qo‘shish', ru: 'Добавить факт', en: 'Add fact' },
  adminFactText: { uz: 'Fakt matni', ru: 'Текст факта', en: 'Fact text' },
  adminSourceTitle: { uz: 'Manba nomi', ru: 'Название источника', en: 'Source title' },
  adminSourceUrl: { uz: 'Manba havolasi', ru: 'Ссылка на источник', en: 'Source URL' },
  adminPlaceOptional: { uz: 'Obyekt (ixtiyoriy)', ru: 'Объект (необязательно)', en: 'Place (optional)' },
  adminRole: { uz: 'Rol', ru: 'Роль', en: 'Role' },
  adminCreated: { uz: 'Qo‘shilgan', ru: 'Создан', en: 'Created' },
  adminStats: { uz: 'Ko‘rsatkichlar', ru: 'Показатели', en: 'Overview' },

  shareTrip: {
    uz: 'Sayohatni ulashish (QR)',
    ru: 'Поделиться поездкой (QR)',
    en: 'Share the trip (QR)',
  },
  shareCopy: { uz: 'Havolani nusxalash', ru: 'Скопировать ссылку', en: 'Copy link' },
  offlineBanner: {
    uz: 'Internet yo‘q — saqlangan marshrut va tekshiruvlar ko‘rsatilyapti.',
    ru: 'Нет сети — показываю сохранённый маршрут и проверки.',
    en: 'You are offline — showing the saved itinerary and checks.',
  },
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
