import type { I18nText } from '../lib/types.ts';

/**
 * Ichki obidalar: majmua ichidagi har bir inshoot — o'z rasmi va turistga
 * qiziq izohi bilan.
 *
 * NIMA UCHUN ALOHIDA QATLAM. «Bu yerda nimani ko'rasiz» ro'yxati faqat nom
 * chiplaridan iborat edi — turist «Tillakori» so'zini o'qiydi, lekin nega
 * kirishi kerakligini bilmaydi. Endi har obida o'z kadri va bitta «ichkariga
 * kiritadigan» fakti bilan turadi: gid uni ko'rsatmasa, so'raladigan narsa
 * endi aniq.
 *
 * HALOLLIK QOIDASI. Izohlar yozuvchi xayolidan emas — har biri korpusdagi
 * manbali faktlardan (c01, c03, c86, c87) tuzilgan va kartada manba havolasi
 * ko'rsatiladi. Korpus matni ruscha kanon bo'lib qoladi (uni tarjima qilish —
 * qayta hikoya); bu yerdagi matn esa interfeys qatlami, place.summary bilan
 * bir xil maqomda: uch tilda, foydalanuvchi uchun.
 *
 * Rasmlar Vikiombordan, mualliflik va litsenziya bilan; fayllar repoda —
 * zalda internet uzilsa ham chiqadi.
 */

export type Landmark = {
  id: string;
  name: I18nText;
  /** Turistni ichkariga kiritadigan bitta qiziq fakt — manbaga tayangan. */
  blurb: I18nText;
  photo: { url: string; author: string; license: string; page: string };
  /** Izoh tayangan manba: kartada ko'rsatiladi. */
  source: { title: I18nText; url: string };
};

const UNESCO = {
  title: {
    uz: 'YuNESKO: Samarqand — madaniyatlar chorrahasi',
    ru: 'ЮНЕСКО: Самарканд — перекрёсток культур',
    en: 'UNESCO: Samarkand — Crossroads of Cultures',
  },
  url: 'https://whc.unesco.org/en/list/603',
};

export const LANDMARKS: Record<string, Landmark[]> = {
  registan: [
    {
      id: 'registan-ulugbek',
      name: {
        uz: 'Ulug‘bek madrasasi (1417–1420)',
        ru: 'Медресе Улугбека (1417–1420)',
        en: 'Ulugh Beg Madrasah (1417–1420)',
      },
      blurb: {
        uz: 'Maydondagi eng qadimgi bino — astronom hukmdor Ulug‘bek davrida qurilgan. O‘z zamonida musulmon Sharqining yetakchi ilm markazlaridan biri: bu yerda matematika, geometriya va astronomiya o‘qitilgan.',
        ru: 'Старейшее здание площади, построено при астрономе-правителе Улугбеке. В своё время — один из ведущих учебных центров мусульманского Востока: здесь преподавали математику, геометрию и астрономию.',
        en: 'The oldest building on the square, raised under the astronomer-king Ulugh Beg. In its day, one of the leading schools of the Muslim East: mathematics, geometry and astronomy were taught here.',
      },
      photo: {
        url: '/photos/registan-ulugbek.jpg',
        author: 'Bgag',
        license: 'CC0',
        page: 'https://commons.wikimedia.org/wiki/File:Ulugh_Beg_Madrasa,_Samarkand.jpg',
      },
      source: UNESCO,
    },
    {
      id: 'registan-sherdor',
      name: {
        uz: 'Sherdor madrasasi (1619–1636)',
        ru: 'Медресе Шердор (1619–1636)',
        en: 'Sher-Dor Madrasah (1619–1636)',
      },
      blurb: {
        uz: 'Nomi «sherlar bilan bezatilgan» degani. Peshtoqqa qarang: ohularni quvayotgan yirtqichlar va inson yuzli quyosh — o‘sha davr musulmon me’morchiligi uchun jonli mavjudot tasviri juda noodatiy.',
        ru: 'Название означает «украшенное львами». Посмотрите на портал: хищники, преследующие ланей, и солнце с человеческим лицом — изображения живых существ крайне необычны для мусульманской архитектуры того времени.',
        en: 'The name means “adorned with lions”. Look up at the portal: big cats chasing does beneath a sun with a human face — depictions of living beings are strikingly unusual for Islamic architecture of that era.',
      },
      photo: {
        url: '/photos/registan-sherdor.jpg',
        author: 'Soham Banerjee (Flickr)',
        license: 'CC BY 2.0',
        page: 'https://commons.wikimedia.org/wiki/File:The_Sher_Dor_(9330856335)-cropped.jpg',
      },
      source: UNESCO,
    },
    {
      id: 'registan-tillakori',
      name: {
        uz: 'Tillakori madrasasi (1646–1660)',
        ru: 'Медресе Тилля-Кари (1646–1660)',
        en: 'Tilya-Kori Madrasah (1646–1660)',
      },
      blurb: {
        uz: 'Nomi «oltin bilan qoplangan» degani — masjid ichi mo‘l-ko‘l zarhal qilingan, gumbaz ostida turib tepaga qarang. Bu bino talabalar hujralari bilan birga Samarqandning jome masjidi vazifasini ham o‘tagan.',
        ru: 'Название переводится как «покрытое золотом»: интерьер мечети обильно позолочен — встаньте под куполом и посмотрите вверх. Помимо учебных келий, здание служило соборной мечетью Самарканда.',
        en: 'The name means “covered in gold”: the mosque interior is lavishly gilded — stand beneath the dome and look up. Besides its student cells, the building served as Samarkand’s Friday mosque.',
      },
      photo: {
        url: '/photos/registan-tillakori.jpg',
        author: 'WWELNUR',
        license: 'CC BY 4.0',
        page: 'https://commons.wikimedia.org/wiki/File:Tilya-Kori_Madrasah.jpg',
      },
      source: UNESCO,
    },
  ],
};

export function landmarksFor(placeId: string): Landmark[] {
  return LANDMARKS[placeId] ?? [];
}
