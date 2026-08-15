'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { NearbyPois } from '@/components/NearbyPois';
import { PlacePhoto } from '@/components/PlacePhoto';
import { SaveButton } from '@/components/SaveButton';
import { officialFactsFor } from '@/lib/sources';
import { RequestForm } from '@/components/RequestForm';
import { SpeakButton } from '@/components/SpeakButton';
import { useTrip } from '@/components/TripProvider';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import type { CorpusItem, Place } from '@/lib/types';

export function PlaceCard({ place, facts }: { place: Place; facts: CorpusItem[] }) {
  const { lang } = useTrip();

  return (
    <div className="flex flex-col gap-4">
      {/*
        Раскладка «во весь экран фото, поверх него карточка» — из макета
        мобильного приложения. На телефоне снимок выходит за поля страницы
        (-mx-4 гасит padding у main) и занимает всю ширину, как в приложении;
        на широком экране поля возвращаются, потому что фотография во весь
        монитор выглядит как заставка, а не как карточка объекта.

        Карточка заходит на фото снизу (-mt-8) и скругляется сверху: так
        макет отделяет «место» от «рассказа о месте». Заголовок остаётся
        внутри карточки, а не поверх снимка: поверх фото текст читается
        по-разному на каждой картинке, и контраст обещать нельзя.
      */}
      <div className="-mx-4 sm:mx-0">
        <PlacePhoto
          placeId={place.id}
          alt={tr(place.name, lang)}
          lang={lang}
          ratio={4 / 3}
          credit
          priority
          sizes="(max-width: 900px) 100vw, 900px"
        />
      </div>

      <section className="card -mt-8 rounded-t-[var(--radius-lg)] sm:mt-0">
        <div className="muted text-[13px]">
          {tr(REGION_LABEL[place.region], lang)} · {place.visitMinutes} {t('planMinutes', lang)}
        </div>
        <h1 className="text-xl font-bold">{tr(place.name, lang)}</h1>
        <p className="muted mt-1 text-sm">{tr(place.summary, lang)}</p>
        {/* Значок опирается на счёт, а не на желание показать галочку:
            сколько фактов об этом объекте пришло из официальных источников. */}
        {(() => {
          const { official, total } = officialFactsFor(facts, place.id);
          if (official === 0) return null;
          return (
            <div className="mt-2">
              <span className="tag tag-ok" title={t('officialHint', lang)}>
                <Icon name="shield" size={13} />
                {t('officialFacts', lang)}: {official} {t('officialOf', lang)} {total}
              </span>
            </div>
          );
        })()}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SaveButton placeId={place.id} />
          <SpeakButton
            text={[tr(place.name, lang), tr(place.summary, lang), ...facts.map((f) => f.text)].join('. ')}
          />
        </div>
      </section>

      {place.highlights && place.highlights.length > 0 && (
        <section className="card flex flex-col gap-2">
          <div className="text-sm font-semibold">{t('placeHighlights', lang)}</div>
          <ul className="flex flex-col gap-1 text-[13px]">
            {place.highlights.map((item) => (
              <li key={item.en} className="flex gap-2">
                <span style={{ color: 'var(--accent)' }}>•</span>
                <span>{tr(item, lang)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <section className="card">
        <NearbyPois place={place} />
      </section>

      <section className="flex flex-wrap items-start gap-2">
        <Link href={`/check?place=${place.id}`} className="btn btn-primary">
          {t('placeCheckHere', lang)}
        </Link>
        <Link href="/plan" className="btn">
          {t('tabPlan', lang)}
        </Link>
        {/* обратная связь с места: закрыто, ремонт, обман с ценой */}
        <RequestForm kind="place-problem" targetId={place.id} />
      </section>
    </div>
  );
}
