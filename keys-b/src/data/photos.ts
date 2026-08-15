// СГЕНЕРИРОВАНО: node scripts/fetch-photos.mjs — руками не править.
//
// Каждая фотография лежит в public/places и несёт автора и лицензию: на витрине
// не должно быть ни одного куска данных без происхождения, включая картинки.
// Атрибуция показывается в интерфейсе (см. PlacePhoto).

export type PhotoCredit = {
  src: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const PHOTOS: Record<string, PhotoCredit> = {
  'registan': {
    src: '/places/registan.jpg',
    author: "Gustavo Jeronimo from Aranjuez, Spain",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Registan_-_Gusjer.jpg",
  },
  'ichan-kala': {
    src: '/places/ichan-kala.jpg',
    author: "LBM1948",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jiva,_Itchan_Kala_09.jpg",
  },
  'poi-kalyan': {
    src: '/places/poi-kalyan.jpg',
    author: "Adam Harangozó",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kalyan_minaret,_Bukhara.jpg",
  },
  'gur-emir': {
    src: '/places/gur-emir.jpg',
    author: "Adam Jones from Kelowna, BC, Canada",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Detail_of_Gur-e-Amir_Mausoleum_-_Samarkand_-_Uzbekistan_-_02_(7480325572).jpg",
  },
  'shahi-zinda': {
    src: '/places/shahi-zinda.jpg',
    author: "This picture has been taken by Oleg Yunakov . Contact e-mail: yunakov gmail.com . Image ca",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Islamic_compex_Shakhi_Zinda_-_02.jpg",
  },
  'khast-imam': {
    src: '/places/khast-imam.jpg',
    author: "LBM1948",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hazrat_Imam_01.jpg",
  },
  'kalta-minor': {
    src: '/places/kalta-minor.jpg',
    author: "TwoWings",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kalta_Minor.jpg",
  },
  'ark': {
    src: '/places/ark.jpg',
    author: "Davide Mauro",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ark_Fortress_in_Bukhara_04.jpg",
  },
  'ulugbek-observatory': {
    src: '/places/ulugbek-observatory.jpg',
    author: "Michel Benoist",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Samarkand_observatoire_ulugh_beg.jpg",
  },
  'chorsu': {
    src: '/places/chorsu.jpg',
    author: "Adam Harangozó",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Chorsu_Bazaar_in_Tashkent.jpg",
  },
  'islamic-civilization': {
    src: '/places/islamic-civilization.jpg',
    author: "Зинҳор Насрӣ",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Center_of_Islamic_Civilization_of_Uzbekistan_Tashkent_2026_001.jpg",
  },
};

export function photoOf(placeId: string): PhotoCredit | undefined {
  return PHOTOS[placeId];
}
