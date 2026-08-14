'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { QrScanner } from '@/components/QrScanner';
import { useTrip } from '@/components/TripProvider';
import { VoiceInput } from '@/components/VoiceInput';
import { GUIDES } from '@/data/guides';
import { PLACE_BY_ID } from '@/data/places';
import { t, tr } from '@/lib/i18n';
import type { CheckStatus, CheckVerdict, I18nText, Lang, Mode } from '@/lib/types';
import type { UiKey } from '@/lib/i18n';

type Result = { verdict: CheckVerdict; passages: string[]; mode: Mode };

// Примеры для демо — на языке интерфейса.
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

const STATUS_UI: Record<CheckStatus, { key: UiKey; color: string }> = {
  confirmed: { key: 'statusConfirmed', color: 'var(--ok)' },
  refuted: { key: 'statusRefuted', color: 'var(--danger)' },
  unclear: { key: 'statusUnclear', color: 'var(--muted)' },
};

const SPEECH_LOCALE: Record<Lang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export default function CheckPage() {
  const { lang } = useTrip();
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
        body: JSON.stringify({ claim: value, lang, guideId: guideId || undefined, placeId: placeId ?? undefined }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setResult(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const status = result ? STATUS_UI[result.verdict.status] : null;

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">{t('checkTitle', lang)}</h1>
        <p className="muted mt-1 text-sm">{t('checkLead', lang)}</p>
      </section>

      {place && (
        <section className="card flex flex-wrap items-center gap-2 text-sm">
          <span className="tag">{t('placeContext', lang)}</span>
          <b>{tr(place.name, lang)}</b>
          <Link
            href={`/place/${place.id}`}
            className="underline"
            style={{ color: 'var(--accent)' }}
          >
            {t('placeFacts', lang)}
          </Link>
        </section>
      )}

      <section className="card flex flex-col gap-3">
        <textarea
          className="field min-h-24"
          placeholder={t('checkPlaceholder', lang)}
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
        />
        <div className="flex flex-wrap items-start gap-2">
          <button className="btn btn-primary" disabled={loading} onClick={() => check(claim)}>
            {loading ? t('checkLoading', lang) : t('checkButton', lang)}
          </button>
          <VoiceInput lang={SPEECH_LOCALE[lang]} onText={(text) => check(text)} />
          <QrScanner />
        </div>
        <label className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="muted">{t('checkWhoSaid', lang)}</span>
          <select className="field max-w-56" value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            <option value="">{t('checkNoGuide', lang)}</option>
            {GUIDES.map((guide) => (
              <option key={guide.id} value={guide.id}>
                {guide.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button key={example.en} className="chip" onClick={() => check(example[lang])}>
              {example[lang]}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="card text-sm" style={{ color: 'var(--danger)' }}>
          {t('checkError', lang)}
        </div>
      )}

      {result && status && (
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold" style={{ color: status.color }}>
              {t(status.key, lang)}
            </span>
            <span className="tag">
              {result.mode === 'ai' ? t('modeAi', lang) : t('modeOffline', lang)}
            </span>
            {guideId && <span className="tag">{t('checkCounted', lang)}</span>}
          </div>

          <blockquote className="muted text-sm italic">«{result.verdict.claim}»</blockquote>
          <p className="text-sm leading-relaxed">{result.verdict.explanation}</p>

          {result.verdict.correction && (
            <p className="text-sm font-semibold">
              {t('correctLabel', lang)} {result.verdict.correction}
            </p>
          )}

          {result.verdict.sources.length > 0 && (
            <div className="text-[13px]">
              <div className="muted mb-1">{t('sourcesLabel', lang)}</div>
              <ul className="flex flex-col gap-1">
                {result.verdict.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {source.title}
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
                  <li key={passage} className="muted">
                    {passage}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
