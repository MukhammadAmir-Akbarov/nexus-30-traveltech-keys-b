'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { NearbyPois } from '@/components/NearbyPois';
import { OpenNow } from '@/components/OpenNow';
import { PinButton } from '@/components/PinButton';
import { PlacePhoto } from '@/components/PlacePhoto';
import { SaveButton } from '@/components/SaveButton';
import { officialFactsFor } from '@/lib/sources';
import { RequestForm } from '@/components/RequestForm';
import { SpeakButton } from '@/components/SpeakButton';
import { useTrip } from '@/components/TripProvider';
import { usdToUzsLabel } from '@/lib/budget';
import { navigatorUrl } from '@/lib/route';
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
        <div className="muted text-[13px]">{tr(REGION_LABEL[place.region], lang)}</div>
        <h1 className="text-xl font-bold">{tr(place.name, lang)}</h1>
        <p className="muted mt-1 text-sm">{tr(place.summary, lang)}</p>

        {/*
          Ряд из трёх плиток — как в макете: время осмотра, факты, билет.
          Раньше эти три числа были размазаны по карточке разными способами
          (минуты — в серой строке над заголовком, факты — плашкой, билет —
          тегом), и ни одно не читалось с одного взгляда.

          Счёт фактов опирается на данные, а не на желание показать галочку:
          сколько утверждений об объекте пришло из официальных источников.
        */}
        {(() => {
          const { official, total } = officialFactsFor(facts, place.id);
          return (
            <div className="stat-row mt-3">
              <div className="stat">
                <Icon name="clock" size={16} />
                <span className="stat-label">{t('placeStatTime', lang)}</span>
                <b className="stat-value">
                  {place.visitMinutes} {t('planMinutes', lang)}
                </b>
              </div>
              <div className="stat" title={t('officialHint', lang)}>
                <Icon name="shield" size={16} />
                <span className="stat-label">{t('placeStatFacts', lang)}</span>
                <b className="stat-value">
                  {official} {t('officialOf', lang)} {total}
                </b>
              </div>
              <div className="stat">
                <Icon name="check" size={16} />
                <span className="stat-label">{t('placeTicket', lang)}</span>
                <b className="stat-value">
                  {place.ticketUsd ? `$${place.ticketUsd}` : t('placeFree', lang)}
                </b>
                {place.ticketUsd ? (
                  <span className="stat-label">{usdToUzsLabel(place.ticketUsd, lang)}</span>
                ) : null}
              </div>
            </div>
          );
        })()}

        {/*
          Главное действие объекта стоит здесь, а не в конце страницы.
          До этой правки «проверить, что сказал гид» лежало под пятью
          карточками: до него доходил только тот, кто дочитал до низа, —
          то есть никто из тех, кто стоит в группе рядом с гидом.

          Макет держит такую кнопку прикреплённой к низу экрана. Мы этот приём
          не копируем: нижнюю полосу у нас уже занимают вкладки (`.tabbar`,
          fixed, z-30), и вторая плавающая панель встала бы поверх первой.
          Цель макета — «главное действие всегда видно» — достигается тем,
          что кнопка стоит на первом экране.
        */}
        <Link href={`/check?place=${place.id}`} className="btn btn-primary mt-3 w-full sm:w-auto">
          <Icon name="shield" size={16} />
          {t('placeCheckHere', lang)}
        </Link>

        {/* Часы работы лежали в данных и не показывались тут вовсе:
            человек у входа видел всё, кроме того, что ему нужно сейчас. */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          <OpenNow place={place} />
          {place.accessible && <span className="tag tag-ok">{t('placesAccessible', lang)}</span>}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SaveButton placeId={place.id} />
          {/* Закрепить объект можно было только изнутри готового маршрута —
              то есть тот, которого в маршруте нет, закрепить было нельзя. */}
          <PinButton placeId={place.id} />
          <SpeakButton
            text={[tr(place.name, lang), tr(place.summary, lang), ...facts.map((f) => f.text)].join('. ')}
          />
          {/* Карточка отвечала на «что это», но не на «как сюда дойти». */}
          <a
            className="btn"
            href={navigatorUrl([{ lat: place.lat, lng: place.lng }])}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="route" size={16} />
            {t('placeNavigator', lang)}
          </a>
        </div>
      </section>

      {place.highlights && place.highlights.length > 0 && (
        <section className="card flex flex-col gap-2">
          <div className="text-sm font-semibold">{t('placeHighlights', lang)}</div>
          <ul className="flex flex-col gap-1 text-[13px]">
            {place.highlights.map((item) => (
              <li key={item.en} className="flex gap-2">
                <span style={{ color: 'var(--accent-ink)' }}>•</span>
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
                style={{ color: 'var(--accent-ink)' }}
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

      {/* Проверка уехала наверх, к заголовку: здесь остались действия,
          за которыми специально спускаются вниз. */}
      <section className="flex flex-wrap items-start gap-2">
        <Link href="/plan" className="btn">
          {t('tabPlan', lang)}
        </Link>
        {/* обратная связь с места: закрыто, ремонт, обман с ценой */}
        <RequestForm kind="place-problem" targetId={place.id} />
      </section>
    </div>
  );
}
