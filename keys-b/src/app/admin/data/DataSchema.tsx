'use client';

import { Icon } from '@/components/Icon';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

/** Связи между таблицами — те же, что описаны в `db.ts`, но видимые. */
const RELATIONS: { from: string; to: string; via: string }[] = [
  { from: 'corpus', to: 'places', via: 'placeId' },
  { from: 'photos', to: 'places', via: 'ключ записи' },
  { from: 'verdicts', to: 'guides', via: 'guideId' },
  { from: 'verdicts', to: 'places', via: 'placeId' },
  { from: 'accuracy', to: 'guides', via: 'ключ / guideId|placeId' },
  { from: 'users', to: 'guides', via: 'guideId' },
  { from: 'requests', to: 'guides · places', via: 'targetId' },
];

export function DataSchema({
  tables,
  problems,
}: {
  tables: { table: string; rows: number; source: string }[];
  problems: string[];
}) {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-lg font-bold">{t('dataTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-sm">{t('dataLead', lang)}</p>
      </section>

      {/* Главное на странице: связна база прямо сейчас или нет. */}
      <section
        className="card flex flex-wrap items-center gap-3"
        style={{
          background: problems.length === 0 ? 'var(--ok-weak)' : 'var(--danger-weak)',
          borderColor: 'transparent',
        }}
      >
        <Icon name={problems.length === 0 ? 'check' : 'alert'} size={22} />
        <div>
          <b style={{ color: problems.length === 0 ? 'var(--ok)' : 'var(--danger)' }}>
            {problems.length === 0 ? t('dataOk', lang) : t('dataBroken', lang)}
          </b>
          <p className="muted mt-0.5 text-[13px]">{t('dataCheckNote', lang)}</p>
        </div>
      </section>

      {problems.length > 0 && (
        <section className="card flex flex-col gap-1 text-[13px]">
          {problems.map((problem) => (
            <div key={problem} style={{ color: 'var(--danger)' }}>
              {problem}
            </div>
          ))}
        </section>
      )}

      <section className="card flex flex-col gap-2">
        <b className="text-sm">{t('dataTables', lang)}</b>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <tbody>
              {tables.map((row) => (
                <tr key={row.table} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5 pe-3 font-semibold">{row.table}</td>
                  <td className="py-1.5 pe-3 text-end tabular-nums">{row.rows}</td>
                  <td className="muted py-1.5">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted text-[12px]">{t('dataSourceNote', lang)}</p>
      </section>

      <section className="card flex flex-col gap-2">
        <b className="text-sm">{t('dataRelations', lang)}</b>
        <ul className="flex flex-col gap-1 text-[13px]">
          {RELATIONS.map((rel) => (
            <li key={`${rel.from}-${rel.to}-${rel.via}`} className="flex flex-wrap items-center gap-2">
              <span className="tag">{rel.from}</span>
              <span className="muted">→</span>
              <span className="tag">{rel.to}</span>
              <span className="muted">· {rel.via}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
