import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { OfflineReady } from '@/components/OfflineReady';
import { Onboarding } from '@/components/Onboarding';
import { SkipLink } from '@/components/SkipLink';
import { TabBar } from '@/components/TabBar';
import { TripProvider } from '@/components/TripProvider';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });

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
      <body className={geist.variable}>
        <TripProvider>
          <OfflineReady />
          <Onboarding />
          {/* с клавиатуры первым делом предлагаем перепрыгнуть навигацию,
              иначе до содержимого приходится проходить всю шапку каждый раз */}
          <SkipLink />
          <Nav />
          <main id="main" className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">
            {children}
          </main>
          <Footer />
          <TabBar />
        </TripProvider>
      </body>
    </html>
  );
}
