'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';
import { QrScanner } from '@/components/QrScanner';
import { RequestForm } from '@/components/RequestForm';
import { useTrip } from '@/components/TripProvider';
import { VoiceInput } from '@/components/VoiceInput';
import { PhotoCheck } from '@/components/PhotoCheck';
import { GUIDES } from '@/data/guides';
import { PLACE_BY_ID } from '@/data/places';
import { t, tr } from '@/lib/i18n';
import type {
  CheckStatus,
  CheckVerdict,
  ClaimSource,
  I18nText,
  Lang,
  Mode,
  SourceTier,
} from '@/lib/types';
import type { UiKey } from '@/lib/i18n';
// Тип берётся у источника, а не переписывается здесь. Копия уже разошлась
// однажды: в store.ts появился новый исход, а этот список о нём не узнал —
// и `COUNTED_UI[result.counted]` вернул бы undefined прямо в разметке.
// Импорт только типовой: в сборку клиента ничего из store.ts не попадает.
import type { RecordOutcome } from '@/lib/store';

type Counted = RecordOutcome;
type Disputed = {
  question: string;
  note: string;
  positions: { claim: string; title: string; url: string; tier?: SourceTier }[];
};

/** Плашка качества источника: ЮНЕСКО и туристический портал — не одно и то же. */
function SourceTierTag({ tier, lang }: { tier?: SourceTier; lang: Lang }) {
  const official = tier === 'official';
  return (
    <span className={official ? 'tag tag-ok' : 'tag'}>
      {t(official ? 'sourceOfficial' : 'sourceSecondary', lang)}
    </span>
  );
}
type Result = {
  verdict: CheckVerdict;
  passages: string[];
  mode: Mode;
  counted?: Counted;
  disputed?: Disputed;
};

/** Что показать про учёт в рейтинге гида — вместо молчаливого «учтено» всегда. */
const COUNTED_UI: Record<Counted, { key: UiKey; cls: string }> = {
  counted: { key: 'checkCounted', cls: 'tag tag-accent' },
  duplicate: { key: 'checkDuplicate', cls: 'tag tag-warn' },
  'rate-limited': { key: 'checkRateLimited', cls: 'tag tag-warn' },
  // Из <select> такого не выйдет — список строится по реальным гидам.
  // Но вердикт приходит из общего ответа, и молчать здесь нельзя: человек
  // выбрал гида и вправе знать, что в репутацию ничего не легло.
  'unknown-guide': { key: 'checkUnknownGuide', cls: 'tag tag-warn' },
};

const EXAMPLES: I18nText[] = [
  {
    uz: 'Registon XII asrda qurilgan',
    ru: 'Регистан построен в XII веке',
    en: 'Registan was built in the 12th century',
  },
  {
    uz: 'Kalon minorasi balandligi 100 metr',
    ru: 'Минарет Калян высотой 100 метров',
    en: 'The Kalyan minaret is 100 metres tall',
  },
  {
    uz: 'Ichan Qal’a — O‘zbekistondagi birinchi YuNESKO obyekti',
    ru: 'Ичан-Кала — первый объект ЮНЕСКО в Узбекистане',
    en: 'Itchan Kala is Uzbekistan’s first UNESCO site',
  },
];

// Вердикт читается за секунду: иконка + слово + цвет. Цвет не единственный
// признак — иначе дальтоник видит просто серый текст.
const STATUS_UI: Record<CheckStatus, { key: UiKey; color: string; weak: string; icon: IconName }> =
  {
    confirmed: { key: 'statusConfirmed', color: 'var(--ok)', weak: 'var(--ok-weak)', icon: 'check' },
    refuted: {
      key: 'statusRefuted',
      color: 'var(--danger)',
      weak: 'var(--danger-weak)',
      icon: 'close',
    },
    unclear: { key: 'statusUnclear', color: 'var(--warn)', weak: 'var(--warn-weak)', icon: 'alert' },
  };

const SPEECH_LOCALE: Record<Lang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

/** Откуда человек услышал утверждение: гид — лишь один из источников. */
const CLAIM_SOURCES: { value: ClaimSource; key: UiKey }[] = [
  { value: 'guide', key: 'srcGuide' },
  { value: 'sign', key: 'srcSign' },
  { value: 'internet', key: 'srcInternet' },
  { value: 'other', key: 'srcOther' },
];

/** История проверок живёт на устройстве: открывается без сети и никуда не уходит. */
const HISTORY_KEY = 'nexus30.checks';
type HistoryItem = { claim: string; status: CheckStatus; at: string };

/**
 * Заготовки под полем вопроса. Не украшение: пустое поле — самая частая
 * причина, по которой человек ничего не проверяет. Первая подставляет
 * название объекта, если турист пришёл со страницы объекта или по QR-коду.
 */
const SUGGESTIONS: { key: UiKey; text: (place: string, lang: Lang) => string }[] = [
  {
    key: 'suggestAge',
    text: (place, lang) =>
      place
        ? { uz: `${place} qachon qurilgan?`, ru: `Когда построен(а) ${place}?`, en: `When was ${place} built?` }[lang]
        : { uz: 'Registon qachon qurilgan?', ru: 'Когда построен Регистан?', en: 'When was the Registan built?' }[lang],
  },
  {
    key: 'suggestGuideSaid',
    text: (_place, lang) =>
      ({
        uz: 'Gid aytdi: Registon XII asrda qurilgan',
        ru: 'Гид сказал: Регистан построен в XII веке',
        en: 'The guide said the Registan was built in the 12th century',
      })[lang],
  },
  {
    key: 'suggestHeight',
    text: (place, lang) =>
      place
        ? { uz: `${place} haqidagi ma'lumot to‘g‘rimi?`, ru: `Верна ли информация про ${place}?`, en: `Is the information about ${place} correct?` }[lang]
        : { uz: 'Kalon minorasi balandligi 46 metr', ru: 'Высота минарета Калян — 46 метров', en: 'The Kalyan minaret is 46 metres tall' }[lang],
  },
];

/**
 * useSearchParams требует границы Suspense: без неё страница не может быть
 * отрендерена заранее. Обёртка тонкая — вся страница внутри.
 */
export default function CheckPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
      <CheckPageInner />
    </Suspense>
  );
}

function CheckPageInner() {
  const { lang, trip, update } = useTrip();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [guideId, setGuideId] = useState('');
  const [source, setSource] = useState<ClaimSource | ''>('');
  const [copied, setCopied] = useState(false);

  // Объект из QR-ссылки известен уже на первом рендере — эффект не нужен.
  const params = useSearchParams();
  const placeId = params.get('place');
  // Проверка была одноразовой: её нельзя было ни отправить гиду, ни открыть
  // повторно. Вопрос живёт в адресе — ссылка воспроизводит ровно её.
  const [claim, setClaim] = useState(() => params.get('q') ?? '');

  // А вот localStorage прочитать в рендере нельзя: на сервере его нет,
  // и разметка разошлась бы с клиентской. Эффект здесь — правильный способ.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryItem[];
      // localStorage в рендере читать нельзя: на сервере его нет и разметка
      // разошлась бы с клиентской. Эффект здесь — правильный способ.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.length) setHistory(saved);
    } catch {
      // повреждённое хранилище — просто пустая история
    }
  }, []);

  const place = placeId ? (PLACE_BY_ID[placeId] ?? null) : null;

  const check = useCallback(async (text: string) => {
    const value = text.trim();
    if (!value) return;
    setClaim(value);
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: value,
          lang,
          guideId: guideId || undefined,
          placeId: placeId ?? undefined,
          source: source || undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Result;
      setResult(data);

      // запоминаем на устройстве: раньше проверка терялась при переходе на другую вкладку
      setHistory((prev) => {
        const next = [
          { claim: value, status: data.verdict.status, at: new Date().toISOString().slice(0, 16).replace('T', ' ') },
          ...prev.filter((h) => h.claim !== value),
        ].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lang, guideId, placeId, source]);

  // Пришли по ссылке с вопросом — показываем вердикт, а не пустую форму.
  // Один раз: иначе смена языка или источника перезапускала бы проверку.
  const asked = useRef(false);
  useEffect(() => {
    const q = params.get('q');
    if (!q || asked.current) return;
    asked.current = true;
    void check(q);
  }, [params, check]);

  // При споре источников статус «нет данных» врёт: система знает больше обычного —
  // она знает, что источники не сошлись, и показывает обе версии.
  const status = result
    ? result.disputed
      ? { key: 'disputedTitle' as UiKey, color: 'var(--warn)', weak: 'var(--warn-weak)', icon: 'alert' as IconName }
      : STATUS_UI[result.verdict.status]
    : null;

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1>{t('checkTitle', lang)}</h1>
        <p className="muted prose-measure mt-2 text-[15px]">{t('checkLead', lang)}</p>
      </section>

      {place && (
        <section className="card flex flex-wrap items-center gap-2 py-3 text-sm">
          <Icon name="pin" />
          <b>{tr(place.name, lang)}</b>
          <Link
            href={`/place/${place.id}`}
            className="ms-auto inline-flex items-center gap-1 text-[13px] underline"
            style={{ color: 'var(--accent-ink)' }}
          >
            {t('placeFacts', lang)}
            <Icon name="external" size={14} />
          </Link>
        </section>
      )}

      <section className="card flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">{t('checkFieldLabel', lang)}</span>
          <textarea
            className="field min-h-28 leading-relaxed"
            placeholder={t('checkPlaceholder', lang)}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
          />
        </label>

        {/* Пустое поле не подсказывает, что сюда писать: человек видит форму
            и уходит. Три заготовки снимают этот ступор — первая подставляет
            фразу про объект, о котором он сейчас читает. */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(({ key, text }) => (
            <button
              key={key}
              className="chip"
              onClick={() => setClaim(text(place ? tr(place.name, lang) : '', lang))}
            >
              {t(key, lang)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <button
            className="btn btn-primary"
            disabled={loading || !claim.trim()}
            onClick={() => check(claim)}
          >
            <Icon name="search" />
            {loading ? t('checkLoading', lang) : t('checkButton', lang)}
          </button>
          <VoiceInput lang={SPEECH_LOCALE[lang]} onText={(text) => check(text)} />
          {/* третий вход рядом с текстом и голосом: кейс требует одной проверки,
              а не трёх продуктов */}
          <PhotoCheck />
          <QrScanner />
        </div>

        {/* Откуда услышано. Раньше приложение спрашивало только про гида —
            и получалось, что ошибается всегда он. На деле чаще всего человек
            читает табличку у входа или первую ссылку в поиске. */}
        <div className="flex flex-col gap-1">
          <span className="muted text-[13px]">{t('checkSourceLabel', lang)}</span>
          <div className="flex flex-wrap gap-2">
            {CLAIM_SOURCES.map(({ value, key }) => (
              <button
                key={value}
                className="chip"
                data-active={source === value}
                onClick={() => setSource(source === value ? '' : value)}
              >
                {t(key, lang)}
              </button>
            ))}
          </div>
          <p className="muted prose-measure text-[12px]">{t('checkSourceHint', lang)}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="muted">{t('checkWhoSaid', lang)}</span>
            <select
              className="field max-w-56"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
            >
              <option value="">{t('checkNoGuide', lang)}</option>
              {GUIDES.map((guide) => (
                <option key={guide.id} value={guide.id}>
                  {guide.name}
                </option>
              ))}
            </select>
          </label>
          {/* без этой строки турист не понимает, зачем ему выбирать из десяти незнакомых имён */}
          <p className="muted prose-measure text-[12px]">{t('checkWhoSaidHint', lang)}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="muted text-[12px]">{t('checkExamplesLabel', lang)}</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button key={example.en} className="chip" onClick={() => check(example[lang])}>
                {example[lang]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Результат объявляется скринридеру, а место под него зарезервировано скелетоном */}
      <div aria-live="polite">
        {loading && (
          <section className="card flex flex-col gap-3">
            <div className="skeleton" style={{ width: 170, height: 26 }} />
            <div className="skeleton" style={{ width: '100%', height: 16 }} />
            <div className="skeleton" style={{ width: '86%', height: 16 }} />
            <div className="skeleton" style={{ width: 220, height: 16 }} />
          </section>
        )}

        {error && !loading && (
          <div className="card flex items-center gap-2 text-sm" style={{ color: 'var(--danger)' }}>
            <Icon name="alert" />
            {t('checkError', lang)}
          </div>
        )}

        {result && status && !loading && (
          <section
            className="card appear flex flex-col gap-4"
            style={{ borderInlineStartWidth: 4, borderInlineStartColor: status.color }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold"
                style={{ background: status.weak, color: status.color }}
              >
                <Icon name={status.icon} size={16} />
                {t(status.key, lang)}
              </span>
              <span
                className="tag"
                title={result.mode === 'ai' ? undefined : t('modeOfflineHint', lang)}
              >
                {result.mode === 'ai' ? t('modeAi', lang) : t('modeOffline', lang)}
              </span>
              {guideId && result.counted && (
                <span className={COUNTED_UI[result.counted].cls}>
                  {t(COUNTED_UI[result.counted].key, lang)}
                </span>
              )}
            </div>

            <blockquote
              className="muted border-s-2 ps-3 text-sm italic"
              style={{ borderColor: 'var(--border)' }}
            >
              {result.verdict.claim}
            </blockquote>

            {/* Вердикт был одноразовым: показать его гиду или спутнику можно
                было только с экрана. Ссылка воспроизводит ту же проверку. */}
            <button
              className="chip self-start"
              onClick={async () => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', result.verdict.claim);
                if (placeId) url.searchParams.set('place', placeId);
                try {
                  await navigator.clipboard.writeText(url.toString());
                  setCopied(true);
                } catch {
                  // буфер недоступен (нет https или отказ) — показываем адрес,
                  // чтобы его можно было скопировать руками
                  window.prompt(t('verdictShare', lang), url.toString());
                }
              }}
            >
              <Icon name="share" size={14} />
              {t(copied ? 'verdictShareDone' : 'verdictShare', lang)}
            </button>

            {/* Источники расходятся — показываем обе стороны, а не выбираем удобную */}
            {result.disputed && (
              <div
                className="flex flex-col gap-3 rounded-xl p-3"
                style={{ background: 'var(--warn-weak)' }}
              >
                {/* заголовок «источники расходятся» уже стоит в плашке статуса —
                    здесь достаточно самого вопроса, без повтора */}
                <b className="text-[13px]">{result.disputed.question}</b>

                {result.disputed.positions.map((position, index) => (
                  <div key={position.url} className="text-[13px]">
                    <div className="font-semibold">
                      {t('disputedPosition', lang)} {index + 1}: {position.claim}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={position.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 underline"
                        style={{ color: 'var(--accent-ink)' }}
                      >
                        {position.title}
                        <Icon name="external" size={13} />
                      </a>
                      <SourceTierTag tier={position.tier} lang={lang} />
                    </div>
                  </div>
                ))}

                <p className="muted prose-measure text-[12px]">{t('disputedNotCounted', lang)}</p>
              </div>
            )}

            <p className="prose-measure text-[15px] leading-relaxed">{result.verdict.explanation}</p>

            {/* Проверка была тупиком: турист получал вердикт и упирался.
                Отсюда есть два хода — посмотреть объект на карте маршрута
                и закрепить его в поездке. Проверил — добавил к себе. */}
            {/* «Нет данных» — момент, когда человеку нужнее всего подсказка,
                что делать дальше. Раньше здесь была точка. */}
            {result.verdict.status === 'unclear' && (
              <div
                className="flex flex-col gap-2 rounded-xl p-3 text-[13px]"
                style={{ background: 'var(--warn-weak)' }}
              >
                <b>{t('unclearWhatNow', lang)}</b>
                <p className="prose-measure" style={{ color: 'var(--warn)' }}>
                  {t('unclearNote', lang)}
                </p>
                <div className="flex flex-wrap items-start gap-2">
                  <Link className="chip" href="/guides">
                    <Icon name="user" size={14} />
                    {t('unclearAskGuide', lang)}
                  </Link>
                  {place && (
                    <Link className="chip" href={`/place/${place.id}`}>
                      <Icon name="pin" size={14} />
                      {t('unclearWhatKnown', lang)}
                    </Link>
                  )}
                  <RequestForm kind="place-problem" targetId={place?.id ?? 'general'} />
                </div>
              </div>
            )}

            {place && (
              <div className="flex flex-wrap items-center gap-2">
                <Link className="btn" href={`/place/${place.id}`}>
                  <Icon name="pin" size={16} />
                  {t('verdictOnMap', lang)}
                </Link>
                <button
                  className="btn"
                  data-saved={(trip.pinned ?? []).includes(place.id)}
                  onClick={() =>
                    update({
                      pinned: (trip.pinned ?? []).includes(place.id)
                        ? (trip.pinned ?? []).filter((id) => id !== place.id)
                        : [...(trip.pinned ?? []), place.id],
                      excluded: (trip.excluded ?? []).filter((id) => id !== place.id),
                    })
                  }
                >
                  <Icon name={(trip.pinned ?? []).includes(place.id) ? 'check' : 'route'} size={16} />
                  {t(
                    (trip.pinned ?? []).includes(place.id) ? 'verdictSaved' : 'verdictSave',
                    lang,
                  )}
                </button>
                {(trip.pinned ?? []).includes(place.id) && (
                  <Link className="underline text-[13px]" style={{ color: 'var(--accent-ink)' }} href="/plan">
                    {t('verdictOpenPlan', lang)}
                  </Link>
                )}
              </div>
            )}

            {result.verdict.correction && (
              <p
                className="rounded-xl p-3 text-[15px] font-semibold"
                style={{ background: 'var(--surface-2)' }}
              >
                {t('correctLabel', lang)} {result.verdict.correction}
              </p>
            )}

            {result.verdict.sources.length > 0 && (
              <div className="text-[13px]">
                <div className="muted mb-2">{t('sourcesLabel', lang)}</div>
                <ul className="flex flex-col gap-1">
                  {result.verdict.sources.map((source) => (
                    <li key={source.url} className="flex flex-wrap items-center gap-2">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 underline"
                        style={{ color: 'var(--accent-ink)' }}
                      >
                        {source.title}
                        <Icon name="external" size={14} />
                      </a>
                      <SourceTierTag tier={source.tier} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.passages.length > 0 && (
              <details className="text-[13px]">
                <summary>{t('passagesLabel', lang)}</summary>
                <ul className="mt-2 flex flex-col gap-2">
                  {result.passages.map((passage) => (
                    <li key={passage} className="muted prose-measure">
                      {passage}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Кольцо в обе стороны: проверка ловит сказанное ПОСЛЕ, брифинг
                «я на месте» вооружает ДО. Без этой ссылки вторую половину
                кольца с экрана проверки было не найти. */}
            <Link
              href="/nearby"
              className="text-[13px] underline"
              style={{ color: 'var(--accent-ink)' }}
            >
              {t('checkNearbyLink', lang)} →
            </Link>
          </section>
        )}
      </div>

      {history.length > 0 && (
        <section className="card flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm">{t('checkHistoryTitle', lang)}</b>
            <button
              className="chip ms-auto"
              onClick={() => {
                localStorage.removeItem(HISTORY_KEY);
                setHistory([]);
              }}
            >
              {t('checkHistoryClear', lang)}
            </button>
          </div>
          <ul className="flex flex-col gap-1 text-[13px]">
            {history.map((item) => (
              <li key={item.claim} className="flex flex-wrap items-center gap-2">
                <span
                  className="tag"
                  style={{
                    background: STATUS_UI[item.status].weak,
                    color: STATUS_UI[item.status].color,
                  }}
                >
                  {t(STATUS_UI[item.status].key, lang)}
                </span>
                <button className="text-start underline" onClick={() => check(item.claim)}>
                  {item.claim}
                </button>
                <span className="muted ms-auto">{item.at}</span>
              </li>
            ))}
          </ul>
          <span className="muted text-[12px]">{t('checkHistoryHint', lang)}</span>
        </section>
      )}
    </div>
  );
}
