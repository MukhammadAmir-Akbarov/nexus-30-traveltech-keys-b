'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { Icon } from './Icon';
import { useTrip } from './TripProvider';
import { t, tr } from '@/lib/i18n';
import type { Briefing } from '@/lib/briefing';
import type { I18nText, Region } from '@/lib/types';

/**
 * Третий вход в проверку: фотография.
 *
 * Голос и текст уже были, и кейс требует именно этого — «голос, текст, фото:
 * одна проверка», а не три отдельных экрана. Поэтому здесь нет своей ручки:
 * компонент шлёт снимок в тот же /api/check, рядом с полем claim.
 *
 * ЗАЧЕМ ТУРИСТУ. Гид может вообще ничего не сказать, а табличка у входа —
 * на языке, которого турист не знает. Он снимает то, что перед ним, и
 * получает название объекта и факты со ссылками на источники. То есть
 * проверить рассказ гида можно даже тогда, когда рассказа ещё не было.
 *
 * ЧЕСТНОСТЬ РЕЖИМА. Ответ всегда подписан: «узнано по демо-набору» или
 * «узнала модель». Выдавать заранее подготовленные шесть снимков за работу
 * зрения было бы ровно тем обманом, который продукт и ловит. Не узнали —
 * так и говорим, а не показываем пустую карточку.
 */

type PlaceBrief = { id: string; name: I18nText; region: Region };

type VisionResult =
  | { unknown: true }
  | { place: PlaceBrief; mode: 'ai' | 'demo'; confidence: number; briefing: Briefing | null };

/** 4 МБ снимка: столько же принимает схема на сервере. */
const MAX_BYTES = 4 * 1024 * 1024;

const LOCAL = {
  tooBig: {
    uz: 'Surat juda katta (4 MB gacha).',
    ru: 'Снимок слишком большой (до 4 МБ).',
    en: 'The photo is too large (4 MB max).',
  },
  failed: {
    uz: 'Suratni tekshirib bo‘lmadi. Qayta urinib ko‘ring.',
    ru: 'Не удалось проверить снимок. Попробуйте ещё раз.',
    en: 'Could not check the photo. Please try again.',
  },
  working: { uz: 'Aniqlanmoqda…', ru: 'Распознаём…', en: 'Identifying…' },
  openPlace: { uz: 'Obyekt sahifasi', ru: 'Страница объекта', en: 'Open the place' },
  facts: { uz: 'Manbalardan', ru: 'Из источников', en: 'From the sources' },
} satisfies Record<string, I18nText>;

export function PhotoCheck() {
  const { lang } = useTrip();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [failure, setFailure] = useState<keyof typeof LOCAL | null>(null);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setResult(null);
      setFailure(null);

      // Размер проверяем до чтения: незачем тянуть в память то, что сервер
      // всё равно отклонит.
      if (file.size > MAX_BYTES) {
        setFailure('tooBig');
        return;
      }

      setBusy(true);
      try {
        const buffer = await file.arrayBuffer();
        let binary = '';
        const chunk = 0x8000; // btoa не любит очень длинные строки — режем
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }

        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: btoa(binary), mime: file.type, lang }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setResult((await res.json()) as VisionResult);
      } catch {
        setFailure('failed');
      } finally {
        setBusy(false);
        // сбрасываем, иначе повторный выбор того же файла не даст события
        if (input.current) input.current.value = '';
      }
    },
    [lang],
  );

  const found = result && !('unknown' in result) ? result : null;

  return (
    <div className="flex flex-col gap-3">
      {/* capture="environment": на телефоне сразу открывается задняя камера —
          турист стоит у объекта, а не разбирает галерею */}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <button className="btn" disabled={busy} onClick={() => input.current?.click()}>
        <Icon name="qr" size={18} />
        {busy ? tr(LOCAL.working, lang) : t('visionUpload', lang)}
      </button>

      {failure && (
        <p className="text-[13px]" style={{ color: 'var(--danger)' }}>
          {tr(LOCAL[failure], lang)}
        </p>
      )}

      {result && 'unknown' in result && (
        <div className="card text-[13px]">
          <span className="tag tag-warn">{t('visionUnknown', lang).split('.')[0]}</span>
          <p className="prose-measure muted mt-2">{t('visionUnknown', lang)}</p>
        </div>
      )}

      {found && (
        <div className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-lg">{tr(found.place.name, lang)}</b>
            {/* Метка режима обязательна: демо-набор не выдаётся за модель */}
            <span className={found.mode === 'ai' ? 'tag tag-ok' : 'tag tag-accent'}>
              {t(found.mode === 'ai' ? 'visionModeAi' : 'visionModeDemo', lang)}
            </span>
          </div>

          {found.mode === 'demo' && (
            <p className="muted prose-measure text-[12.5px]">{t('visionModeDemoHint', lang)}</p>
          )}

          {found.briefing && (
            <>
              <p className="prose-measure text-[14px]">{found.briefing.summary}</p>
              <div className="flex flex-col gap-2">
                <b className="text-sm">{tr(LOCAL.facts, lang)}</b>
                <ul className="flex flex-col gap-2">
                  {found.briefing.facts.slice(0, 3).map((fact) => (
                    <li key={fact.id} className="text-[13px]">
                      <p className="prose-measure">{fact.text}</p>
                      <span className="muted text-[12px]">{tr(fact.source.title, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div>
            <Link className="btn" href={`/place/${found.place.id}`}>
              {tr(LOCAL.openPlace, lang)}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
