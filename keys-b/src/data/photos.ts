/**
 * Фотографии объектов с Викисклада.
 *
 * Продукт про достоверность источников, поэтому у каждого снимка стоит автор,
 * лицензия и ссылка на страницу файла — иначе получилось бы приложение,
 * которое проверяет чужие факты и молча берёт чужие фотографии.
 *
 * Все лицензии свободные (CC0, CC BY, CC BY-SA, public domain); файлов
 * с несвободной лицензией здесь нет.
 *
 * Собрано скриптом по названиям статей; у двух объектов подходящего снимка
 * на Викискладе не нашлось — там показывается заглушка, а не чужая картинка
 * «примерно про то же».
 */

export type Photo = {
  /**
   * Путь к файлу у нас же, в `public/photos`.
   *
   * Снимки лежат в репозитории, а не тянутся с Викисклада на лету: при первой
   * же загрузке страницы маршрута Викисклад ответил 429 «слишком много
   * запросов», и половина фотографий не пришла. На защите это выглядело бы
   * как сломанное приложение. Заодно офлайн работает без отдельного кэша.
   */
  url: string;
  author: string;
  license: string;
  /** Страница файла: там полная информация о правах. */
  page: string;
};

export const PHOTOS: Record<string, Photo> = {
  'registan': {
    url: '/photos/registan.jpg',
    author: 'Gustavo Jeronimo from Aranjuez, Spain',
    license: 'CC BY 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:RegistanSquare_Samarkand.jpg',
  },
  'gur-emir': {
    url: '/photos/gur-emir.jpg',
    author: 'Willard84',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:ShrineofAmirTimur.jpg',
  },
  'bibi-khanym': {
    url: '/photos/bibi-khanym.jpg',
    author: 'Шухрат Саъдиев',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:%D0%9C%D0%B5%D1%87%D0%B5%D1%82%D1%8C_%D0%91%D0%B8%D0%B1%D0%B8_%D0%A5%D0%B0%D0%BD%D1%83%D0%BC._%D0%A1%D0%B0%D0%BC%D0%B0%D1%80%D0%BA%D0%B0%D0%BD%D0%B4.jpg',
  },
  'shahi-zinda': {
    url: '/photos/shahi-zinda.jpg',
    author: 'Petar Milošević',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Shah-i-Zinda%2C_Samarkand_%28Shohi-Zinda_majmuasi%2C_Samarqand%2C_%D0%A8%D0%B0%D1%85%D0%B8_%D0%97%D0%B8%D0%BD%D0%B4%D0%B0%29.jpg',
  },
  'ulugbek-observatory': {
    url: '/photos/ulugbek-observatory.jpg',
    author: 'Alaexis',
    license: 'CC BY-SA 2.5',
    page: 'https://commons.wikimedia.org/wiki/File%3AUlugh_Beg_observatory.JPG',
  },
  'siab-bazaar': {
    url: '/photos/siab-bazaar.jpg',
    author: 'Shuhrataxmedov',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Siyob_bozori_%28Siyab_bazaar%29.jpg',
  },
  'poi-kalyan': {
    url: '/photos/poi-kalyan.jpg',
    author: 'Официальный веб-сайт Агентства культурного наследия Республики Узбекис',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Poi_Kalon.jpg',
  },
  'ark': {
    url: '/photos/ark.jpg',
    author: 'ほっきー',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Ark_of_Bukhara_2023.9.jpg',
  },
  'samanid-mausoleum': {
    url: '/photos/samanid-mausoleum.jpg',
    author: 'Apfel51',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:UZ_Bukhara_Samanid-mausoleum.jpg',
  },
  'chor-minor': {
    url: '/photos/chor-minor.jpg',
    author: 'Petar Milošević',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Chor_Minor_mosque_%28%D0%A7%D0%BE%D1%80-%D0%9C%D0%B8%D0%BD%D0%BE%D1%80%2C_%D0%91%D1%83%D1%85%D0%B0%D1%80%D0%B0%29.jpg',
  },
  'lyabi-hauz': {
    url: '/photos/lyabi-hauz.jpg',
    author: 'Mario J. Schwaiger',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Nadir_Divan-Beghi_Madrassah.JPG',
  },
  'ichan-kala': {
    url: '/photos/ichan-kala.jpg',
    author: 'Bgag',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Islam_Khodja_Madrasa_01.jpg',
  },
  'kalta-minor': {
    url: '/photos/kalta-minor.jpg',
    author: 'Fulvio Spada from Torino, Italy',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:View_from_the_city_walls%2C_Khiva_%284934484894%29.jpg',
  },
  'islam-khoja': {
    url: '/photos/islam-khoja.jpg',
    author: 'Kagansky',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D1%84%D0%B0%D1%81%D0%B0%D0%B4_%D0%BC%D0%B5%D0%B4%D1%80%D0%B5%D1%81%D0%B5_%D0%A3%D0%BB%D1%83%D0%B3%D0%B1%D0%B5%D0%BA%D0%B0_%D0%B2_%D0%93%D0%B8%D0%B6%D0%B4%D1%83%D0%B2%D0%B0%D0%BD%D0%B5.jpg',
  },
  'khast-imam': {
    url: '/photos/khast-imam.jpg',
    author: 'Ymblanter',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Barakhan_Madrasah_Tashkent.jpg',
  },
  'chorsu': {
    url: '/photos/chorsu.jpg',
    author: 'Theklan',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Chorsu_Market_general_view.jpg',
  },
  'aydarkul': {
    url: '/photos/aydarkul.jpg',
    author: 'DAVID HOLT',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Aydar_Lake.jpg',
  },
  'imam-bukhari': {
    url: '/photos/imam-bukhari.jpg',
    author: 'Alaexis',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:AlBukhari_mausoleum.jpg',
  },
  'islamic-civilization': {
    url: '/photos/islamic-civilization.jpg',
    author: 'Jean Housen',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:20230606_Tashkent123.jpg',
  },
  'juma-mosque': {
    url: '/photos/juma-mosque.jpg',
    author: 'Dan Lundberg',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Juma_Mosque_20140927_Uzbekistan_0284_Khiva_%2815638472913%29.jpg',
  },
  'tash-hauli': {
    url: '/photos/tash-hauli.jpg',
    author: 'Bgag',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Room_in_Tach_Khaouli.jpg',
  },
  'kunya-ark': {
    url: '/photos/kunya-ark.jpg',
    author: 'Petar Milošević',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File%3AKonya_Ark_towers_%28%D0%A6%D0%B8%D1%82%D0%B0%D0%B4%D0%B5%D0%BB%D1%8C_%D0%9A%D1%83%D0%BD%D1%8F-%D0%90%D1%80%D0%BA%2C_Ko%CA%BBhna_ark%29%2C_Itchan_Kala%2C_Khiva.jpg',
  },
  'pahlavan-mahmud': {
    url: '/photos/pahlavan-mahmud.jpg',
    author: 'Ali Aghayari',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Pourya_Vali%E2%80%99s_Tomb.jpg',
  },
  'shakhrisabz-chorsu': {
    url: '/photos/shakhrisabz-chorsu.jpg',
    author: 'Normuratov7',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Amir_Temur_Statue_and_Ak-Saray_Monument_in_Shahrisabz.jpg',
  },
  'chashma': {
    url: '/photos/chashma.jpg',
    author: 'Carpodacus',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Ancient_irrigation_system_in_Nurata.jpg',
  },
  'nurata-fortress': {
    url: '/photos/nurata-fortress.jpg',
    author: 'Carpodacus',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File%3ANurata_fortress.jpg',
  },
  'sarmyshsay': {
    url: '/photos/sarmyshsay.jpg',
    author: 'Alpasli',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sarmishsoy_rasmlari_366.jpg',
  },
  'dorut-tilovat': {
    url: '/photos/dorut-tilovat.jpg',
    author: 'Ezma Kampir',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File%3ADorut_Tilovat_majmuasi.jpg',
  },
  'dorus-siadat': {
    url: '/photos/dorus-siadat.jpg',
    author: 'upyernoz from Haverford, USA',
    license: 'CC BY 2.0',
    page: 'https://commons.wikimedia.org/wiki/File%3ADorus_Siadat%2C_Shakhrisabz_%28491253%29.jpg',
  },
};

export function photoFor(placeId: string): Photo | undefined {
  return PHOTOS[placeId];
}
