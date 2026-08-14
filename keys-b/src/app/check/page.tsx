'use client';

import { useState } from 'react';
import { VoiceInput } from '@/components/VoiceInput';
import type { CheckVerdict, Mode } from '@/lib/types';

type Response = { verdict: CheckVerdict; passages: string[]; mode: Mode };

const EXAMPLES = [
  'Регистан построен в XII веке',
  'Минарет Калян высотой 100 метров',
  'Ичан-Кала — первый объект ЮНЕСКО в Узбекистане',
];

const STATUS_VIEW = {
  confirmed: { label: 'Подтверждено', color: 'var(--ok)' },
  refuted: { label: 'Опровергнуто', color: 'var(--danger)' },
  unclear: { label: 'Нет данных в источниках', color: 'var(--muted)' },
} as const;

export default function CheckPage() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Response | null>(null);
  const [error, setError] = useState('');

  const check = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    setClaim(value);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setResult(await res.json());
    } catch {
      setError('Не удалось проверить. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const view = result ? STATUS_VIEW[result.verdict.status] : null;

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">Проверка того, что говорит гид</h1>
        <p className="muted mt-1 text-sm">
          Ответ строится только по подключённым официальным источникам. Если в них нет
          данных — система так и скажет, а не придумает.
        </p>
      </section>

      <section className="card flex flex-col gap-3">
        <textarea
          className="field min-h-24"
          placeholder="Например: «Регистан построен в XII веке»"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={loading} onClick={() => check(claim)}>
            {loading ? 'Проверяю…' : 'Проверить'}
          </button>
          <VoiceInput onText={(text) => check(text)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button key={example} className="chip" onClick={() => check(example)}>
              {example}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="card text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}

      {result && view && (
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold" style={{ color: view.color }}>
              {view.label}
            </span>
            <span className="tag">
              {result.mode === 'ai' ? 'ответ модели' : 'офлайн-режим'}
            </span>
          </div>

          <blockquote className="muted text-sm italic">«{result.verdict.claim}»</blockquote>
          <p className="text-sm leading-relaxed">{result.verdict.explanation}</p>

          {result.verdict.correction && (
            <p className="text-sm font-semibold">Верно: {result.verdict.correction}</p>
          )}

          {result.verdict.sources.length > 0 && (
            <div className="text-[13px]">
              <div className="muted mb-1">Источники:</div>
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
              <summary className="muted cursor-pointer">Показать найденные отрывки</summary>
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
