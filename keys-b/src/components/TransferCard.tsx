'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon, type IconName } from './Icon';
import { useTrip } from './TripProvider';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { Transfer, TransferMode } from '@/lib/types';
import type { UiKey } from '@/lib/i18n';

// Выбор способа переезда между городами — требование §4.2 ТЗ
// («Shaxsiylashtirilgan transfer va AI trip-planner»).

const MODE: Record<TransferMode, { icon: IconName; key: UiKey }> = {
  plane: { icon: 'plane', key: 'transferPlane' },
  train: { icon: 'train', key: 'transferTrain' },
  bus: { icon: 'bus', key: 'transferBus' },
  car: { icon: 'car', key: 'transferCar' },
  minibus: { icon: 'minibus', key: 'transferMinibus' },
};

export function TransferCard({ transfer }: { transfer: Transfer }) {
  const { lang } = useTrip();
  const [chosen, setChosen] = useState<TransferMode>(transfer.options[0].mode);

  return (
    <div
      className="mb-3 flex flex-col gap-2 rounded-lg px-3 py-2"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-[13px] font-semibold">
        {t('transferTitle', lang)}: {tr(REGION_LABEL[transfer.fromRegion], lang)} →{' '}
        {tr(REGION_LABEL[transfer.toRegion], lang)}
        {/* «км» кириллицей стояло и в узбекском, и в английском интерфейсе */}
        <span className="muted font-normal">
          {' '}
          · ~{transfer.km} {t('legKm', lang)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {transfer.options.map((option) => (
          <button
            key={option.mode}
            className="chip"
            data-active={chosen === option.mode}
            onClick={() => setChosen(option.mode)}
          >
            <Icon name={MODE[option.mode].icon} size={16} />
            {t(MODE[option.mode].key, lang)} · {option.hours}{' '}
            {t('transferHours', lang)} · ${option.priceUsd}
          </button>
        ))}
      </div>

      <div className="muted text-[12px]">
        {t('transferPriceNote', lang)}{' '}
        {chosen !== 'train' && (
          <Link href="/guides" className="underline" style={{ color: 'var(--accent)' }}>
            {t('transferWithGuide', lang)}
          </Link>
        )}
      </div>
    </div>
  );
}
