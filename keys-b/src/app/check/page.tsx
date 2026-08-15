'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { QrScanner } from '@/components/QrScanner';
import { useTrip } from '@/components/TripProvider';
import { VoiceInput } from '@/components/VoiceInput';
import { GUIDES } from '@/data/guides';
import { PLACE_BY_ID } from '@/data/places';
import { t, tr } from '@/lib/i18n';
import type { CheckStatus, CheckVerdict, I18nText, Lang, Mode } from '@/lib/types';
import type { UiKey } from '@/lib/i18n';

type Counted = 'counted' | 'duplicate' | 'rate-limited';
type Disputed = {
  question: string;
  note: string;
  positions: { claim: string; title: string; url: string }[];
};
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

/** История проверок живёт на устройстве: открывается без сети и никуда не уходит. */
const HISTORY_KEY = 'nexus30.checks';
type HistoryItem = { claim: string; status: CheckStatus; at: string };

export default function CheckPage() {
  const { lang } = useTrip();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'));
    } catch {
      // повреждённое хранилище — просто пустая история
    }
  }, []);
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [guideId, setGuideId] = useState('');

  // сюда приходят после сканирования QR у объекта: /check?place=registan
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('place');
    if (id && PLACE_BY_ID[id]) setPlaceId(id);
  }, []);

  const place = placeId ? PLACE_BY_ID[placeId] : null;

  const check = async (text: string) => {
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
  };

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
            style={{ color: 'var(--accent)' }}
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
          <QrScanner />
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
                    <a
                      href={position.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {position.title}
                      <Icon name="external" size={13} />
                    </a>
                  </div>
                ))}

                <p className="muted prose-measure text-[12px]">{t('disputedNotCounted', lang)}</p>
              </div>
            )}

            <p className="prose-measure text-[15px] leading-relaxed">{result.verdict.explanation}</p>

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
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        {source.title}
                        <Icon name="external" size={14} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.passages.length > 0 && (
              <details className="text-[13px]">
                <summary className="muted cursor-pointer">{t('passagesLabel', lang)}</summary>
                <ul className="mt-2 flex flex-col gap-2">
                  {result.passages.map((passage) => (
                    <li key={passage} className="muted prose-measure">
                      {passage}
                    </li>
                  ))}
                </ul>
              </details>
            )}
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
