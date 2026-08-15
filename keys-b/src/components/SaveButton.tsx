'use client';

import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

/**
 * Закладка объекта.
 *
 * Отдельная от «обязательно» вещь, и это важно: закреплённый объект обязан
 * попасть в маршрут, а сохранённый просто лежит в личном списке. Смешивать
 * их — значит менять человеку маршрут за то, что он нажал «сохранить».
 */
export function SaveButton({ placeId, compact = false }: { placeId: string; compact?: boolean }) {
  const { trip, lang, update } = useTrip();
  const saved = (trip.saved ?? []).includes(placeId);

  const toggle = () =>
    update({
      saved: saved
        ? (trip.saved ?? []).filter((id) => id !== placeId)
        : [...(trip.saved ?? []), placeId],
    });

  return (
    <button
      className={compact ? 'chip' : 'btn'}
      data-active={saved}
      aria-pressed={saved}
      onClick={(event) => {
        // в каталоге кнопка лежит внутри ссылки-карточки
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
    >
      <Icon name={saved ? 'check' : 'pin'} size={compact ? 13 : 16} />
      {t(saved ? 'savedAdded' : 'saveAdd', lang)}
    </button>
  );
}
