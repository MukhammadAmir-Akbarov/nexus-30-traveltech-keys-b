'use client';

import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { I18nText, Region } from '@/lib/types';

type Row = {
  placeId: string;
  confirmed: number;
  refuted: number;
  name: I18nText | null;
  region: Region | null;
};

export function AdminReport({ rows }: { rows: Row[] }) {
  const { lang } = useTrip();

  const totalChecks = rows.reduce((sum, r) => sum + r.confirmed + r.refuted, 0);
  const totalRefuted = rows.reduce((sum, r) => sum + r.refuted, 0);

  const csv = () => {
    const head = 'place_id,name_ru,region,checks,refuted,refuted_share\n';
    const body = rows
      .map((r) => {
        const decided = r.confirmed + r.refuted;
        return [
          r.placeId,
          `"${r.name?.ru ?? r.placeId}"`,
          r.region ?? '',
          decided,
          r.refuted,
          (r.refuted / decided).toFixed(2),
        ].join(',');
      })
      .join('\n');
    const blob = new Blob([head + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus30-fact-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="muted prose-measure text-sm">{t('reportLead', lang)}</p>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-2xl font-bold">{totalChecks}</div>
          <div className="text-sm font-semibold">{t('reportChecks', lang)}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>
            {totalRefuted}
          </div>
          <div className="text-sm font-semibold">{t('reportRefuted', lang)}</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold">{rows.length}</div>
          <div className="text-sm font-semibold">{t('reportPlaces', lang)}</div>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="card muted text-sm">{t('reportEmpty', lang)}</div>
      ) : (
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm">{t('reportTableTitle', lang)}</b>
            <button className="chip ms-auto" onClick={csv}>
              <Icon name="share" size={14} />
              CSV
            </button>
          </div>

          {/* широкая таблица прокручивается внутри себя, а не тянет страницу вбок */}
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="muted text-start">
                  <th className="py-2 text-start">{t('reportColPlace', lang)}</th>
                  <th className="py-2 text-start">{t('reportColChecks', lang)}</th>
                  <th className="py-2 text-start">{t('reportColRefuted', lang)}</th>
                  <th className="py-2 text-start">{t('reportColShare', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const decided = row.confirmed + row.refuted;
                  const share = Math.round((row.refuted / decided) * 100);
                  return (
                    <tr key={row.placeId} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-2">
                        <div className="font-semibold">
                          {row.name ? tr(row.name, lang) : row.placeId}
                        </div>
                        {row.region && (
                          <div className="muted text-[12px]">
                            {tr(REGION_LABEL[row.region], lang)}
                          </div>
                        )}
                      </td>
                      <td className="py-2">{decided}</td>
                      <td className="py-2">{row.refuted}</td>
                      <td className="py-2">
                        <span className={share >= 50 ? 'tag tag-danger' : share > 0 ? 'tag tag-warn' : 'tag tag-ok'}>
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="muted prose-measure text-[12px]">{t('reportNote', lang)}</p>
        </section>
      )}
    </div>
  );
}
