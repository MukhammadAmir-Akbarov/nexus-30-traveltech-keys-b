'use client';

import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

// Требование №3 ТЗ: у одиночного путешественника отдельный сценарий,
// а не просто коэффициент в формуле подбора.

const TIPS: UiKey[] = ['soloTip1', 'soloTip2', 'soloTip3', 'soloTip4'];

/**
 * Единые номера Узбекистана. Одиночке в чужой стране это нужнее любого совета,
 * и работать оно должно офлайн — поэтому телефоны лежат в коде, а не в запросе.
 */
const EMERGENCY: { key: UiKey; tel: string }[] = [
  { key: 'sosUnified', tel: '112' },
  { key: 'sosPolice', tel: '102' },
  { key: 'sosAmbulance', tel: '103' },
  { key: 'sosTourism', tel: '+998712389999' },
];

export function SoloPanel() {
  const { trip, lang } = useTrip();
  if (trip.travelType !== 'solo') return null;

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold">{t('soloTitle', lang)}</div>
        <p className="muted text-[13px]">{t('soloLead', lang)}</p>
      </div>

      <ul className="flex flex-col gap-1 text-[13px]">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span style={{ color: 'var(--accent-ink)' }}>•</span>
            <span>{t(tip, lang)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold">{t('sosTitle', lang)}</div>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY.map((item) => (
            // tel: — на телефоне это звонок в одно касание, а не текст для переписывания
            <a key={item.tel} href={`tel:${item.tel}`} className="chip">
              {t(item.key, lang)} · {item.tel}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
