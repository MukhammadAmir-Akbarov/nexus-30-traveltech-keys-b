'use client';

import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { closingSoon, hoursLine, isOpenAt } from '@/lib/hours';
import { useTashkentMinutes } from '@/lib/use-clock';
import { t } from '@/lib/i18n';
import type { Place } from '@/lib/types';

/**
 * Часы работы объекта и ответ на единственный вопрос человека, стоящего
 * у входа: открыто сейчас или нет.
 *
 * Время считаем по Ташкенту, а не по часам телефона: у приехавшего из Стамбула
 * они показывают на два часа меньше, и «открыто» превратилось бы во «врёт».
 */
export function OpenNow({ place }: { place: Place }) {
  const { lang } = useTrip();
  // до гидратации времени нет — показываем часы работы без вердикта «сейчас»
  const now = useTashkentMinutes();

  const line = hoursLine(place);
  if (!line) {
    return (
      <span className="tag" title={t('placeHoursNote', lang)}>
        <Icon name="clock" size={13} />
        {t('placeAlwaysOpen', lang)}
      </span>
    );
  }

  const open = now === null ? null : isOpenAt(place, now);
  const soon = now !== null && open === true && closingSoon(place, now);

  return (
    <span
      className={open === false ? 'tag tag-warn' : soon ? 'tag tag-warn' : 'tag'}
      title={t('placeHoursNote', lang)}
    >
      <Icon name="clock" size={13} />
      {t('placeHours', lang)} {line}
      {open !== null && (
        <b style={{ color: open ? 'var(--ok)' : 'var(--warn)' }}>
          · {t(open ? 'placeOpenNow' : 'placeClosedNow', lang)}
        </b>
      )}
      {soon && <span style={{ color: 'var(--warn)' }}>· {t('placeClosingSoon', lang)}</span>}
    </span>
  );
}
