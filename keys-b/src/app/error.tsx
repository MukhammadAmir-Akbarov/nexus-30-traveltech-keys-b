'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

/**
 * Своя страница сбоя.
 *
 * Без неё любая ошибка на клиенте выдавала пустой экран: на демо это худшее,
 * что может случиться, потому что выглядит как «приложение сломалось целиком».
 * Здесь есть и попытка повторить, и выход в разделы, которые точно работают.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useTrip();

  useEffect(() => {
    // в консоль — чтобы на демо было что показать, если спросят «что случилось»
    console.error('[ui]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <h1>{t('errorTitle', lang)}</h1>
      <p className="muted prose-measure text-[15px]">{t('errorText', lang)}</p>
      {error.digest && <code className="muted text-[12px]">{error.digest}</code>}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={reset}>
          <Icon name="route" size={16} />
          {t('errorRetry', lang)}
        </button>
        <Link className="btn" href="/">
          {t('notFoundHome', lang)}
        </Link>
      </div>
    </div>
  );
}
