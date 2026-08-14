'use client';

import { useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';

type Stats = {
  places: number;
  guides: number;
  verifiedGuides: number;
  facts: number;
  users: number;
};

export function AdminDashboard({ stats }: { stats: Stats }) {
  const { lang } = useTrip();
  const [exported, setExported] = useState('');

  // Экспорт нужен, потому что хранилище в памяти: так правки переносятся в data/*
  const exportJson = async () => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'export' }),
    });
    setExported(JSON.stringify(await res.json(), null, 2));
  };

  const cards = [
    { label: t('planTitle', lang), value: stats.places, hint: 'places' },
    { label: t('adminGuides', lang), value: `${stats.verifiedGuides} / ${stats.guides}`, hint: 'verified / total' },
    { label: t('adminFacts', lang), value: stats.facts, hint: 'corpus' },
    { label: t('adminUsers', lang), value: stats.users, hint: 'accounts' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="muted text-sm">{t('adminLead', lang)}</p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.hint} className="card">
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm font-semibold">{card.label}</div>
            <div className="muted text-[12px]">{card.hint}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <button className="btn self-start" onClick={exportJson}>
          {t('adminExport', lang)}
        </button>
        {exported && (
          <textarea readOnly className="field min-h-64 font-mono text-[12px]" value={exported} />
        )}
      </section>
    </div>
  );
}
