'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

// Прямой ответ на критерий «применимость» (30% оценки): что в прототипе демо,
// что берётся снаружи и что нужно от Комитета, чтобы это заработало по-настоящему.
// Без такой страницы жюри домысливает границы сами — обычно не в нашу пользу.

const ROWS: { now: UiKey; prod: UiKey }[] = [
  { now: 'howDataNow', prod: 'howDataProd' },
  { now: 'howGuidesNow', prod: 'howGuidesProd' },
  { now: 'howFactsNow', prod: 'howFactsProd' },
  { now: 'howAiNow', prod: 'howAiProd' },
  { now: 'howStoreNow', prod: 'howStoreProd' },
];

const STEPS: UiKey[] = ['howStep1', 'howStep2', 'howStep3', 'howStep4'];

export default function HowPage() {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1>{t('howTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('howLead', lang)}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <b className="text-sm">{t('howTableTitle', lang)}</b>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="muted">
                <th className="py-2 text-start">{t('howColNow', lang)}</th>
                <th className="py-2 text-start">{t('howColProd', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.now} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-2 pe-4">{t(row.now, lang)}</td>
                  <td className="py-2">{t(row.prod, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card flex flex-col gap-2">
        <b className="text-sm">{t('howStepsTitle', lang)}</b>
        <ol className="flex flex-col gap-2 text-[13px]">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-2">
              <span className="step-dot">{index + 1}</span>
              <span className="prose-measure">{t(step, lang)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card flex flex-col items-start gap-2">
        <b className="text-sm">{t('howQrTitle', lang)}</b>
        <p className="muted prose-measure text-[13px]">{t('howQrHint', lang)}</p>
        <Link href="/qr" className="btn">
          <Icon name="qr" />
          {t('howQrOpen', lang)}
        </Link>
      </section>

      <section className="card">
        <p className="muted prose-measure text-[13px]">{t('howPrivacy', lang)}</p>
      </section>
    </div>
  );
}
