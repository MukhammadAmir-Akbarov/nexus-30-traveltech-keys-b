'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

/**
 * Своя страница «не нашлось».
 *
 * Раньше на несуществующий объект — а QR-код у входа живёт годами и переживает
 * переименования — Next отдавал свою служебную заглушку: чёрный текст «404»
 * по-английски, без шапки, без языка интерфейса и без единого пути дальше.
 * Турист с телефоном у ворот получал тупик вместо подсказки.
 */
export default function NotFound() {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col items-start gap-4">
      <h1>{t('notFoundTitle', lang)}</h1>
      <p className="muted prose-measure text-[15px]">{t('notFoundText', lang)}</p>
      <div className="flex flex-wrap gap-2">
        <Link className="btn btn-primary" href="/places">
          <Icon name="pin" size={16} />
          {t('tabPlaces', lang)}
        </Link>
        <Link className="btn" href="/">
          {t('notFoundHome', lang)}
        </Link>
        <Link className="btn" href="/check">
          <Icon name="shield" size={16} />
          {t('tabCheck', lang)}
        </Link>
      </div>
    </div>
  );
}
