import type { I18nText, Region } from '../lib/types.ts';

/**
 * Где ночевать — по районам, а не по гостиницам.
 *
 * ПОЧЕМУ НЕ СПИСОК ОТЕЛЕЙ. Названия и цены конкретных гостиниц мы проверить
 * не можем: партнёрских данных нет, а придумать их означало бы поставить
 * на витрину ровно тот сорт непроверяемых фактов, против которого сделан
 * весь продукт. Районы — вещь публичная и устойчивая: Ичан-Кала внутри стен
 * останется Ичан-Калой и через год, а цена конкретного номера — нет.
 *
 * ПОЧЕМУ ЭТО ВСЁ РАВНО ПОЛЕЗНО. Турист выбирает не отель, а расстояние до
 * первой точки маршрута: жить внутри стен Хивы и жить за стенами — это разные
 * поездки при одинаковой звёздности. Район плюс ссылка на живой поиск отвечает
 * на его вопрос честнее, чем выдуманная карточка отеля с ценой.
 *
 * Цены — вилки в долларах за ночь, ориентир, а не тариф; в интерфейсе так
 * и подписано. Бронирование мы не делаем осознанно: для него нужен
 * юридический контур, а недоделанное бронирование хуже отсутствующего.
 */

export type Stay = {
  id: string;
  region: Region;
  name: I18nText;
  /** Чем этот район отличается — то, ради чего его выбирают. */
  why: I18nText;
  /** Ориентировочная вилка за ночь, USD. Не тариф. */
  fromUsd: number;
  toUsd: number;
  /** Объект маршрута, до которого отсюда пешком — связывает ночёвку с планом. */
  nearPlaceId?: string;
};

export const STAYS: Stay[] = [
  // --- Самарканд ---
  {
    id: 'smk-registan',
    region: 'samarkand',
    name: { uz: 'Registon atrofi', ru: 'Вокруг Регистана', en: 'Registan area' },
    why: {
      uz: 'Registon, Bibixonim va Siyob bozori piyoda masofada. Kechqurun yoritilgan maydonga chiqish oson.',
      ru: 'Регистан, Биби-Ханым и Сиабский базар в пешей доступности. Вечером легко выйти на подсвеченную площадь.',
      en: 'Registan, Bibi-Khanym and the Siab bazaar are all walkable. Easy to step out to the lit-up square at night.',
    },
    fromUsd: 25,
    toUsd: 90,
    nearPlaceId: 'registan',
  },
  {
    id: 'smk-university',
    region: 'samarkand',
    name: { uz: 'Universitet xiyoboni', ru: 'Университетский бульвар', en: 'University boulevard' },
    why: {
      uz: 'Tinchroq va arzonroq, markazga 10–15 daqiqa. Kafelar ko‘p, turistik narxlar kamroq.',
      ru: 'Тише и дешевле, до центра 10–15 минут. Много кафе, цены менее туристические.',
      en: 'Quieter and cheaper, 10–15 minutes from the centre. Plenty of cafes at less touristy prices.',
    },
    fromUsd: 15,
    toUsd: 45,
  },

  // --- Бухара ---
  {
    id: 'bkh-lyabi',
    region: 'bukhara',
    name: { uz: 'Labi Hovuz atrofi', ru: 'Вокруг Ляби-Хауза', en: 'Lyabi-Hauz area' },
    why: {
      uz: 'Tarixiy markazning yuragi: hovuz, choyxonalar va kechki hayot. Ko‘p obyekt piyoda.',
      ru: 'Сердце исторического центра: хауз, чайханы и вечерняя жизнь. Большинство объектов пешком.',
      en: 'The heart of the old town: the pool, tea houses and evening life. Most sights on foot.',
    },
    fromUsd: 20,
    toUsd: 70,
    nearPlaceId: 'lyabi-hauz',
  },
  {
    id: 'bkh-ark',
    region: 'bukhara',
    name: { uz: 'Ark va Poi Kalon yaqini', ru: 'Рядом с Арком и Пои-Калян', en: 'Near the Ark and Po-i-Kalyan' },
    why: {
      uz: 'Ertalab olomon yig‘ilgunga qadar Kalon minorasiga chiqish qulay.',
      ru: 'Удобно выйти к минарету Калян утром, пока не собрались группы.',
      en: 'Handy for reaching the Kalyan minaret early, before the tour groups arrive.',
    },
    fromUsd: 20,
    toUsd: 60,
    nearPlaceId: 'poi-kalyan',
  },

  // --- Хива ---
  {
    id: 'khv-inside',
    region: 'khiva',
    name: { uz: 'Ichan Qal‘a ichida', ru: 'Внутри Ичан-Калы', en: 'Inside Itchan Kala' },
    why: {
      uz: 'Devor ichida tunash — kechqurun va tongda shahar deyarli bo‘sh bo‘ladi. Hamma obyekt eshik oldida.',
      ru: 'Ночёвка внутри стен: вечером и на рассвете город почти пустой. Все объекты у порога.',
      en: 'Sleeping inside the walls: at dusk and dawn the town is nearly empty. Every sight is at your door.',
    },
    fromUsd: 30,
    toUsd: 85,
    nearPlaceId: 'ichan-kala',
  },
  {
    id: 'khv-outside',
    region: 'khiva',
    name: { uz: 'Devor tashqarisi (Dishan Qal‘a)', ru: 'За стенами (Дишан-Кала)', en: 'Outside the walls (Dishan Kala)' },
    why: {
      uz: 'Arzonroq, darvozagacha 5–10 daqiqa piyoda. Mashina qo‘yish osonroq.',
      ru: 'Дешевле, до ворот 5–10 минут пешком. Проще с парковкой.',
      en: 'Cheaper, a 5–10 minute walk to the gates. Parking is easier.',
    },
    fromUsd: 15,
    toUsd: 40,
  },

  // --- Ташкент ---
  {
    id: 'tsh-old',
    region: 'tashkent',
    name: { uz: 'Eski shahar / Chorsu', ru: 'Старый город / Чорсу', en: 'Old town / Chorsu' },
    why: {
      uz: 'Hazrati Imom va Chorsu bozori yonida. Metro bekati yaqin.',
      ru: 'Рядом Хазрати Имам и базар Чорсу. Метро под боком.',
      en: 'Next to Hazrati Imam and the Chorsu bazaar, with a metro station close by.',
    },
    fromUsd: 20,
    toUsd: 60,
    nearPlaceId: 'khast-imam',
  },
  {
    id: 'tsh-center',
    region: 'tashkent',
    name: { uz: 'Markaz / Amir Temur xiyoboni', ru: 'Центр / сквер Амира Темура', en: 'Centre / Amir Temur square' },
    why: {
      uz: 'Vokzal va aeroportga chiqish qulay, restoranlar ko‘p. Uzoq marshrutning boshlanishi yoki oxiri uchun mos.',
      ru: 'Удобно выезжать на вокзал и в аэропорт, много ресторанов. Подходит для начала или конца длинного маршрута.',
      en: 'Easy to reach the station and airport, plenty of restaurants. Good for the start or end of a long trip.',
    },
    fromUsd: 30,
    toUsd: 120,
  },

  // --- Шахрисабз и Нурата ---
  {
    id: 'shk-center',
    region: 'shakhrisabz',
    name: { uz: 'Oqsaroy atrofi', ru: 'Вокруг Ак-Сарая', en: 'Around Ak-Saray' },
    why: {
      uz: 'Shahar kichik, hamma narsa markazda. Ko‘pchilik Samarqanddan kunlik chiqadi.',
      ru: 'Город небольшой, всё в центре. Многие приезжают из Самарканда одним днём.',
      en: 'The town is small and everything is central. Many visit as a day trip from Samarkand.',
    },
    fromUsd: 15,
    toUsd: 40,
    nearPlaceId: 'ak-saray',
  },
  {
    id: 'nur-yurt',
    region: 'nurata',
    name: { uz: 'Aydarko‘l yurt lageri', ru: 'Юрточный лагерь на Айдаркуле', en: 'Yurt camp at Aydarkul' },
    why: {
      uz: 'Mehmonxona emas — dashtdagi yurt. Tunash, tuya sayri va yulduzli osmon shu yerda.',
      ru: 'Не гостиница, а юрта в степи. Ночёвка, катание на верблюдах и звёздное небо — здесь.',
      en: 'Not a hotel but a yurt on the steppe: the overnight stay, camel rides and the night sky.',
    },
    fromUsd: 25,
    toUsd: 55,
    nearPlaceId: 'aydarkul',
  },
];

export function staysFor(region: Region): Stay[] {
  return STAYS.filter((stay) => stay.region === region);
}
