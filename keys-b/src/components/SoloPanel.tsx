'use client';

import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

// Требование №3 ТЗ: у одиночного путешественника отдельный сценарий,
// а не просто коэффициент в формуле подбора.

const TIPS: UiKey[] = ['soloTip1', 'soloTip2', 'soloTip3', 'soloTip4'];

export function SoloPanel() {
  const { trip, lang } = useTrip();
  if (trip.travelType !== 'solo') return null;

  return (
    <section className="card flex flex-col gap-2">
      <div className="text-sm font-semibold">{t('soloTitle', lang)}</div>
      <p className="muted text-[13px]">{t('soloLead', lang)}</p>
      <ul className="flex flex-col gap-1 text-[13px]">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span style={{ color: 'var(--accent)' }}>•</span>
            <span>{t(tip, lang)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
