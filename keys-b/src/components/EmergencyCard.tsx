'use client';

import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { EMERGENCY } from '@/data/emergency';
import { t, tr } from '@/lib/i18n';

/**
 * Экстренные номера.
 *
 * В корпусе они были, но найти их можно было только задав вопрос — а человек
 * в беде не будет формулировать запрос к системе проверки фактов. Отдельная
 * карточка, доступная без сети: номера зашиты в код и приходят вместе
 * со страницей, а не по запросу.
 *
 * Номера — те же, что в корпусе (абзац c62), не выдуманные.
 */
export function EmergencyCard() {
  const { lang } = useTrip();

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <b className="text-sm">{t('emergencyTitle', lang)}</b>
        <p className="muted prose-measure mt-1 text-[13px]">{t('emergencyLead', lang)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EMERGENCY.map((item) => (
          <a key={item.number} className="btn" href={`tel:${item.number}`}>
            <Icon name={item.icon} size={16} />
            <b>{item.number}</b>
            <span className="muted">{tr(item.label, lang)}</span>
          </a>
        ))}
      </div>

      <p className="muted text-[12px]">{t('emergencySource', lang)}</p>
    </section>
  );
}
