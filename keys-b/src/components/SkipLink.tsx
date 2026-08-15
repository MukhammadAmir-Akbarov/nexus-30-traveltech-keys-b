'use client';

import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Первая остановка при обходе с клавиатуры: перепрыгнуть шапку и попасть
// сразу в содержимое. Отдельный клиентский компонент нужен только затем,
// чтобы надпись была на языке интерфейса, как и всё остальное.
export function SkipLink() {
  const { lang } = useTrip();
  return (
    <a href="#main" className="skip-link">
      {t('skipToContent', lang)}
    </a>
  );
}
