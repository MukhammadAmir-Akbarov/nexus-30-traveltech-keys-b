'use client';

import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

/**
 * «Обязательно в маршрут».
 *
 * Отличается от закладки: закреплённый объект обязан попасть в маршрут и
 * проходит даже сквозь жёсткие фильтры (семейный формат, доступность), а
 * сохранённый просто лежит в личном списке. Раньше закрепить объект можно
 * было только из уже построенного маршрута — то есть тот, которого в маршруте
 * нет, закрепить было нельзя вовсе. Круг замыкается здесь: нашёл в каталоге —
 * поставил в маршрут.
 */
export function PinButton({ placeId, compact = false }: { placeId: string; compact?: boolean }) {
  const { trip, lang, update } = useTrip();
  const pinned = (trip.pinned ?? []).includes(placeId);

  const toggle = () =>
    update({
      pinned: pinned
        ? (trip.pinned ?? []).filter((id) => id !== placeId)
        : [...(trip.pinned ?? []), placeId],
      // закрепить и одновременно держать в исключённых — противоречие
      excluded: (trip.excluded ?? []).filter((id) => id !== placeId),
    });

  return (
    <button
      className={compact ? 'chip' : 'btn'}
      data-active={pinned}
      aria-pressed={pinned}
      onClick={(event) => {
        // в каталоге кнопка лежит внутри ссылки-карточки
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
    >
      <Icon name={pinned ? 'check' : 'route'} size={compact ? 13 : 16} />
      {t(pinned ? 'verdictSaved' : 'planPin', lang)}
    </button>
  );
}
