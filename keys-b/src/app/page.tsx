'use client';

/**
 * Главная — витрина страны, а не анкета.
 *
 * Было: форма контекста поездки, а поверх неё при первом входе модальный опрос
 * из четырёх шагов. Человек отвечал на вопросы раньше, чем понимал, что за
 * продукт перед ним. Вопросы переехали в /plan — туда, где турист сам захотел
 * маршрут, и где они наконец осмысленны.
 *
 * Оформление — бирюзовая шапка мобильного приложения, но на токенах дизайн-
 * системы (--accent и есть тот самый бирюзовый), а не на хардкоде: иначе
 * тёмная тема на первом же экране разъезжается.
 *
 * ЧЕГО ЗДЕСЬ НЕТ И ПОЧЕМУ:
 *
 * - Внешних картинок. Фотографии лежат в public/places и пришли с Викисклада
 *   с автором и лицензией. Demo обязано пережить падение сети в зале: картинка
 *   с чужого домена в этот момент станет белым прямоугольником на первом экране.
 * - Рейтингов вида «4.9». Нам их неоткуда взять: отзывов у объектов нет,
 *   статистики посещаемости — тоже. Нарисованная звёздочка в продукте про
 *   достоверность — это ровно то, в чём мы упрекаем недобросовестного гида.
 *   Вместо неё показываем то, что у нас правда есть: число фактов с источником.
 * - Строк в коде. Интерфейс трёхъязычный, и словарь один — src/lib/i18n.ts.
 *
 * Атрибуции под каждой карточкой тоже нет — она повторялась шесть раз и делала
 * витрину рябой. CC BY-SA требует указать автора «разумным образом», а не под
 * каждой миниатюрой: подпись стоит на странице объекта, где кадр показан
 * крупно, и полным списком на /how.
 */

import Link from 'next/link';
import { useTrip } from '@/components/TripProvider';
import { HomeShowcase } from '@/components/HomeShowcase';
import { VoiceTrip } from '@/components/VoiceTrip';
import {
  GUIDE_LANGS,
  GUIDE_LANG_LABEL,
  INTEREST_LABEL,
  INTERESTS,
  REGIONS,
  REGION_LABEL,
  TRAVEL_TYPES,
  TRAVEL_TYPE_LABEL,
  t,
  tr,
} from '@/lib/i18n';
import { BUDGET_DESC, BUDGET_LABEL, BUDGET_LEVELS, BUDGET_PRICE } from '@/lib/budget';
import type { GuideLang, Interest, Pace } from '@/lib/types';

const PACES: { pace: Pace; key: 'paceRelaxed' | 'paceNormal' | 'pacePacked' }[] = [
  { pace: 'relaxed', key: 'paceRelaxed' },
  { pace: 'normal', key: 'paceNormal' },
  { pace: 'packed', key: 'pacePacked' },
];

/** Верхняя граница поездки: одна и та же для дат и для ползунка, иначе они спорят. */
const MAX_DAYS = 14;

/** Число дней поездки из выбранных дат: обе даты включительно. */
function daysBetween(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.min(MAX_DAYS, Math.round(ms / 86400000) + 1);
}

/**
 * Летняя жара определяется датой, а не галочкой: выбрал июль — правило включилось.
 * Галочка остаётся ручной поправкой для тех, кто планирует без дат.
 */
function isSummer(date?: string): boolean | null {
  if (!date) return null;
  const month = Number(date.slice(5, 7));
  return month >= 6 && month <= 8;
}

export default function Home() {
  const { trip, lang, update } = useTrip();

  const toggleInterest = (interest: Interest) => {
    const has = trip.interests.includes(interest);
    update({
      interests: has
        ? trip.interests.filter((i) => i !== interest)
        : [...trip.interests, interest],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Витрина: погода на сегодня и три объекта под интересы. Раньше первое,
          что видел человек, — форма из восьми полей. */}
      <HomeShowcase />

      {/* «Я на месте» — самый короткий путь к главной новой функции.
          Турист открывает приложение, стоя у объекта, и брифинг должен быть
          в одном нажатии от первого экрана: без этой карточки /nearby
          находился только через навигацию, и жюри его не находило. */}
      <Link
        href="/nearby"
        className="card card-link flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-pill)]"
            style={{ background: 'var(--accent-weak)', color: 'var(--accent-ink)' }}
            aria-hidden="true"
          >
            📍
          </span>
          <div>
            <div className="text-[15px] font-semibold">{t('homeNearbyTitle', lang)}</div>
            <p className="muted mt-0.5 text-[13px]">{t('homeNearbyHint', lang)}</p>
          </div>
        </div>
        <span className="shrink-0 text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
          {t('homeNearbyCta', lang)} →
        </span>
      </Link>

      <section>
        <h2>{t('homeTitle', lang)}</h2>
        <p className="muted prose-measure mt-2 text-[15px]">{t('homeLead', lang)}</p>
      </section>

      <section className="card flex flex-col gap-5">
        <VoiceTrip />

        <div>
          <div className="mb-2 text-sm font-semibold">
            {t('fieldRegion', lang)}{' '}
            <span className="muted font-normal">· {t('fieldRegionsHint', lang)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => {
              const active =
                region === 'all' ? trip.regions.length === 0 : trip.regions.includes(region);
              return (
                <button
                  key={region}
                  className="chip"
                  data-active={active}
                  onClick={() =>
                    update(
                      region === 'all'
                        ? { regions: [], region: 'all' }
                        : {
                            regions: trip.regions.includes(region)
                              ? trip.regions.filter((r) => r !== region)
                              : [...trip.regions, region],
                            region,
                          },
                    )
                  }
                >
                  {region === 'all' ? t('allUzbekistan', lang) : tr(REGION_LABEL[region], lang)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">{t('fieldDates', lang)}</div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="muted">{t('fieldDateFrom', lang)}</span>
            <input
              type="date"
              className="field max-w-44"
              value={trip.startDate ?? ''}
              onChange={(e) => {
                const startDate = e.target.value;
                update({
                  startDate,
                  days: daysBetween(startDate, trip.endDate) ?? trip.days,
                  summer: isSummer(startDate) ?? trip.summer,
                });
              }}
            />
            <span className="muted">{t('fieldDateTo', lang)}</span>
            <input
              type="date"
              className="field max-w-44"
              min={trip.startDate}
              value={trip.endDate ?? ''}
              onChange={(e) => {
                const endDate = e.target.value;
                update({
                  endDate,
                  days: daysBetween(trip.startDate, endDate) ?? trip.days,
                  summer: isSummer(trip.startDate) ?? trip.summer,
                });
              }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">{t('fieldInterests', lang)}</div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                className="chip"
                data-active={trip.interests.includes(interest)}
                onClick={() => toggleInterest(interest)}
              >
                {tr(INTEREST_LABEL[interest], lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">{t('fieldTravelType', lang)}</div>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TYPES.map((type) => (
                <button
                  key={type}
                  className="chip"
                  data-active={trip.travelType === type}
                  onClick={() => update({ travelType: type })}
                >
                  {tr(TRAVEL_TYPE_LABEL[type], lang)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={trip.summer}
              onChange={(e) => update({ summer: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t('fieldSummer', lang)}
          </label>

          <div>
            <div className="mb-2 text-sm font-semibold">
              {t('fieldPace', lang)}{' '}
              <span className="muted font-normal">· {t('paceHint', lang)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PACES.map(({ pace, key }) => (
                <button
                  key={pace}
                  className="chip"
                  data-active={(trip.pace ?? 'normal') === pace}
                  onClick={() => update({ pace })}
                >
                  {t(key, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Бюджет: тот же вопрос, что задаёт мобильное приложение. Он не
              косметический — меняет очки объектов, порядок вариантов переезда
              и предупреждение о превышении дневного потолка. */}
          <div>
            <div className="mb-2 text-sm font-semibold">
              {t('fieldBudget', lang)}{' '}
              <span className="muted font-normal">· {t('budgetHint', lang)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_LEVELS.map((level) => (
                <button
                  key={level}
                  className="chip"
                  data-active={trip.budget === level}
                  title={tr(BUDGET_DESC[level], lang)}
                  onClick={() => update({ budget: trip.budget === level ? undefined : level })}
                >
                  {tr(BUDGET_LABEL[level], lang)}
                  <span className="muted">· {tr(BUDGET_PRICE[level], lang)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Языки общения — не язык интерфейса: узбек может искать
              англоязычного гида. Спрашиваем здесь, используем при подборе. */}
          <div>
            <div className="mb-2 text-sm font-semibold">
              {t('fieldGuideLangs', lang)}{' '}
              <span className="muted font-normal">· {t('guideLangsHint', lang)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GUIDE_LANGS.map((code) => {
                const chosen = trip.guideLangs?.length ? trip.guideLangs : [lang];
                const active = chosen.includes(code as GuideLang);
                return (
                  <button
                    key={code}
                    className="chip"
                    data-active={active}
                    onClick={() =>
                      update({
                        guideLangs: (active
                          ? chosen.filter((l) => l !== code)
                          : [...chosen, code as GuideLang]) as GuideLang[],
                      })
                    }
                  >
                    {tr(GUIDE_LANG_LABEL[code], lang)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">
              {t('fieldDays', lang)}: {trip.days}
            </div>
            <input
              type="range"
              min={1}
              max={MAX_DAYS}
              value={trip.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="w-48 accent-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/check" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardCheckTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardCheckText', lang)}</p>
        </Link>
        <Link href="/plan" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardPlanTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardPlanText', lang)}</p>
        </Link>
        <Link href="/guides" className="card card-link">
          <div className="text-[15px] font-semibold">{t('cardGuidesTitle', lang)}</div>
          <p className="muted mt-1 text-[13px]">{t('cardGuidesText', lang)}</p>
        </Link>
      </section>
    </div>
  );
}
