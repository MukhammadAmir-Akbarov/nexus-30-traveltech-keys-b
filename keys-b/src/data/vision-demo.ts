// СГЕНЕРИРОВАНО: node scripts/build-vision-demo.mjs — руками не править.
//
// Демо-набор распознавания по фотографии: sha256 файла -> id объекта.
// Нужен, пока нет ключа зрения: ветка модели написана целиком, а показать
// её работу надо уже сегодня. Совпадение считается по точному файлу —
// это честный запасной путь, и интерфейс называет его своим именем.

export const VISION_DEMO: Record<string, string> = {
  '72bf40fde946050dd6e5df4abd011c08e34dc394fca90aaa10bf829ab1024093': 'registan',
  '25e02b0f7a2e47aa230ced8df7a8657b0d19c02ea15b9d6cbf7820952c22dece': 'gur-emir',
  '77dc3e44ddd08dfc65f9fe88e0dd9cd1a31fb6e36a27bcdddbab7dcc6d22c996': 'bibi-khanym',
  '59b466f5c217ceca35c12419807e633cf54036d218279d50d5d4afc2ff64f72f': 'shahi-zinda',
  'fadfe64d603348634942c1dfa18c6897504b54378be59c62586dcef5d19924dd': 'ichan-kala',
  '95d190a56023f67cfaa9d353ca6f5077309c0ef15112c9bb7647c8c4852f59d7': 'poi-kalyan',
};

/** Что именно можно загрузить на демо — список для страницы и для судьи. */
export const VISION_DEMO_FILES: { placeId: string; src: string }[] = [
  { placeId: 'registan', src: '/photos/registan.jpg' },
  { placeId: 'gur-emir', src: '/photos/gur-emir.jpg' },
  { placeId: 'bibi-khanym', src: '/photos/bibi-khanym.jpg' },
  { placeId: 'shahi-zinda', src: '/photos/shahi-zinda.jpg' },
  { placeId: 'ichan-kala', src: '/photos/ichan-kala.jpg' },
  { placeId: 'poi-kalyan', src: '/photos/poi-kalyan.jpg' },
];
