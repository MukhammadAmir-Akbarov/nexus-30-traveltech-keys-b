import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Nav } from '@/components/Nav';
import { OfflineReady } from '@/components/OfflineReady';
import { SkipLink } from '@/components/SkipLink';
import { TabBar } from '@/components/TabBar';
import { TripProvider } from '@/components/TripProvider';

// Manrope — тот же шрифт, что в мобильном приложении SafarAI: одна семья
// на весь продукт, чтобы веб и приложение читались как одна система.
const manrope = Manrope({ variable: '--font-sans', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  title: 'TurizmHamroh — ishonchli sayohat hamrohi',
  description:
    'NEXUS30 · TravelTech kеys B: faktlarni tekshirish, AI marshrut va gid tanlash bitta kontekstda.',
};

// Тему выставляем до первой отрисовки, иначе при тёмной теме мигает белым.
const THEME_SCRIPT = `try{var t=localStorage.getItem('nexus30.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={manrope.variable}>
        <TripProvider>
          <OfflineReady />
          {/* Модального опроса при первом входе больше нет: он закрывал продукт
              собой и спрашивал раньше, чем человек понимал, ради чего отвечает.
              Те же вопросы теперь стоят в /plan — после нажатия «спланировать». */}
          {/* с клавиатуры первым делом предлагаем перепрыгнуть навигацию,
              иначе до содержимого приходится проходить всю шапку каждый раз */}
          <SkipLink />
          <Nav />
          <main id="main" className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">
            {children}
          </main>
          {/* над Footer, а не поверх плавающей панели вкладок: она fixed */}
          <InstallPrompt />
          <Footer />
          <TabBar />
        </TripProvider>
      </body>
    </html>
  );
}
