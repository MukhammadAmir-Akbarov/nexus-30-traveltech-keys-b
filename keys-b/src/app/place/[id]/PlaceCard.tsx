'use client';

import Link from 'next/link';
import { useTrip } from '@/components/TripProvider';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { CorpusItem, Place } from '@/lib/types';

export function PlaceCard({ place, facts }: { place: Place; facts: CorpusItem[] }) {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="muted text-[13px]">
          {tr(REGION_LABEL[place.region], lang)} · {place.visitMinutes} {t('planMinutes', lang)}
        </div>
        <h1 className="text-xl font-bold">{tr(place.name, lang)}</h1>
        <p className="muted mt-1 text-sm">{tr(place.summary, lang)}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <div className="text-sm font-semibold">{t('placeFacts', lang)}</div>
        {facts.length === 0 && <div className="muted text-[13px]">{t('placeNoFacts', lang)}</div>}
        <ul className="flex flex-col gap-3">
          {facts.map((fact) => (
            <li key={fact.id} className="text-[13px]">
              <p>{fact.text}</p>
              <a
                href={fact.source.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                {tr(fact.source.title, lang)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link href={`/check?place=${place.id}`} className="btn btn-primary">
          {t('placeCheckHere', lang)}
        </Link>
        <Link href="/plan" className="btn">
          {t('tabPlan', lang)}
        </Link>
      </section>
    </div>
  );
}
