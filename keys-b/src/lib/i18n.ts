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
