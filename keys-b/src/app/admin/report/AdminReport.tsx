'use client';

import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';
import type { ClaimSource, I18nText, Region } from '@/lib/types';

type Row = {
  placeId: string;
  confirmed: number;
  refuted: number;
  name: I18nText | null;
  region: Region | null;
};

type Gap = { claim: string; count: number; placeId?: string; at: string; name: I18nText | null };

type SourceRow = { source: ClaimSource; total: number; refuted: number };

const SOURCE_KEY: Record<ClaimSource, UiKey> = {
  guide: 'srcGuide',
  sign: 'srcSign',
  internet: 'srcInternet',
  other: 'srcOther',
};

export function AdminReport({
  rows,
  gaps = [],
  sources = [],
}: {
  rows: Row[];
  gaps?: Gap[];
  sources?: SourceRow[];
}) {
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

  const gapsCsv = () => {
    const head = 'claim,place_id,asked,last_asked\n';
    const body = gaps
      .map((g) => [`"${g.claim.replace(/"/g, '""')}"`, g.placeId ?? '', g.count, g.at].join(','))
      .join('\n');
    const blob = new Blob([head + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus30-gaps.csv';
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

      {/* О чём спрашивают, а ответа в источниках нет. Это не отчёт о сбоях —
          это список тем, которые Комитету стоит опубликовать первыми. */}
      <section className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <b className="text-sm">{t('reportGapsTitle', lang)}</b>
            <p className="muted prose-measure mt-1 text-[13px]">{t('reportGapsLead', lang)}</p>
          </div>
          {gaps.length > 0 && (
            <button className="btn" onClick={gapsCsv}>
              <Icon name="share" size={16} />
              CSV
            </button>
          )}
        </div>

        {gaps.length === 0 ? (
          <p className="muted text-[13px]">{t('reportGapsEmpty', lang)}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[13px]">
            {gaps.map((gap) => (
              <li key={gap.claim} className="flex flex-wrap items-center gap-2">
                <span className="tag tag-warn">{gap.count}</span>
                <span className="prose-measure">{gap.claim}</span>
                {gap.name && <span className="muted">· {tr(gap.name, lang)}</span>}
                <span className="muted text-[12px]">{gap.at}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Откуда приходит недостоверное. Отчёт по объектам отвечает на «где»,
          этот блок — на «через что»: гид, табличка у входа или первая ссылка
          в поиске. Без него весь механизм выглядит как претензия к гидам. */}
      {sources.length > 0 && (
        <section className="card flex flex-col gap-3">
          <b className="text-sm">{t('reportSourcesTitle', lang)}</b>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="muted text-start">
                  <th className="py-2 text-start">{t('reportColSource', lang)}</th>
                  <th className="py-2 text-start">{t('reportColChecks', lang)}</th>
                  <th className="py-2 text-start">{t('reportColRefuted', lang)}</th>
                  <th className="py-2 text-start">{t('reportColShare', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((row) => {
                  const share = Math.round((row.refuted / row.total) * 100);
                  return (
                    <tr key={row.source} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-2 font-semibold">{t(SOURCE_KEY[row.source], lang)}</td>
                      <td className="py-2">{row.total}</td>
                      <td className="py-2">{row.refuted}</td>
                      <td className="py-2">
                        <span
                          className={
                            share >= 50 ? 'tag tag-danger' : share > 0 ? 'tag tag-warn' : 'tag tag-ok'
                          }
                        >
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted prose-measure text-[12px]">{t('reportSourcesNote', lang)}</p>
        </section>
      )}
    </div>
  );
}
