import type { MetadataRoute } from 'next';

// Публичные страницы — в индекс, служебные — нет.
//
// Личный кабинет гида и панель Комитета закрыты сессией, но в индексе им делать
// нечего и без этого: поисковик их не откроет, а ссылки на страницу входа
// в выдаче — это шум и лишняя цель для перебора паролей.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/guide', '/login', '/api'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
