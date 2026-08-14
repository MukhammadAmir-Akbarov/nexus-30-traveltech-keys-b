import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { TripProvider } from '@/components/TripProvider';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'TurizmHamroh — надёжный спутник туриста',
  description:
    'NEXUS30 · TravelTech кейс B: проверка фактов, AI-маршрут по Узбекистану и подбор гида в одном контексте.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={geist.variable}>
        <TripProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <footer
            className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-[12px]"
            style={{ color: 'var(--muted)' }}
          >
            Прототип для хакатона NEXUS30. Данные об объектах и гидах — демонстрационные;
            в рабочей версии подключается база Комитета по туризму.
          </footer>
        </TripProvider>
      </body>
    </html>
  );
}
