'use client';

import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

type Row = { at: string; actor: string; action: string; target?: string };

/**
 * Что именно делали в панели. Названия действий — те же ключи, что уходят
 * в API: переводить их в человеческие фразы значило бы завести второй словарь,
 * который разойдётся с первым. Здесь важнее точность, чем красота.
 */
export function AdminAudit({ rows }: { rows: Row[] }) {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col gap-4">
      <section>
        <b className="text-sm">{t('auditTitle', lang)}</b>
        <p className="muted prose-measure mt-1 text-[13px]">{t('auditLead', lang)}</p>
      </section>

      {rows.length === 0 ? (
        <div className="card muted text-sm">{t('auditEmpty', lang)}</div>
      ) : (
        <section className="card" style={{ overflowX: 'auto' }}>
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="muted">
                <th className="py-2 text-start">{t('auditWhen', lang)}</th>
                <th className="py-2 text-start">{t('auditWho', lang)}</th>
                <th className="py-2 text-start">{t('auditWhat', lang)}</th>
                <th className="py-2 text-start">{t('auditTarget', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.at}-${index}`}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td className="py-2 whitespace-nowrap">{row.at}</td>
                  <td className="py-2">{row.actor}</td>
                  <td className="py-2 font-semibold">{row.action}</td>
                  <td className="py-2 muted">{row.target ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
