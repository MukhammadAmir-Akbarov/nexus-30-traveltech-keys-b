'use client';

import { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { useTrip } from './TripProvider';
import { INTEREST_LABEL, REGION_LABEL, TRAVEL_TYPE_LABEL, t, tr } from '@/lib/i18n';
import { parseTripPhrase } from '@/lib/voice-trip';
import type { Lang } from '@/lib/types';

// Голосом задать контекст поездки: «хочу в Самарканд на три дня, история».
// Распознавание уже было на проверке фактов — здесь оно применяется к форме,
// которую иначе нужно заполнять пятью нажатиями.

const SPEECH_LOCALE: Record<Lang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export function VoiceTrip() {
  const { lang, update } = useTrip();
  const [heard, setHeard] = useState('');
  const [applied, setApplied] = useState<string[]>([]);

  const apply = (text: string) => {
    setHeard(text);
    const parsed = parseTripPhrase(text);
    if (Object.keys(parsed).length === 0) {
      setApplied([]);
      return;
    }

    update(parsed);

    // Показываем, что именно поняли: голос ошибается, и молча менять контекст
    // поездки нельзя — человек должен видеть, с чем согласился.
    const parts: string[] = [];
    if (parsed.regions?.length) {
      parts.push(parsed.regions.map((r) => tr(REGION_LABEL[r], lang)).join(', '));
    }
    if (parsed.travelType) parts.push(tr(TRAVEL_TYPE_LABEL[parsed.travelType], lang));
    if (parsed.days) parts.push(`${parsed.days} ${t('daysShort', lang)}`);
    if (parsed.interests?.length) {
      parts.push(parsed.interests.map((i) => tr(INTEREST_LABEL[i], lang)).join(', '));
    }
    setApplied(parts);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <VoiceInput lang={SPEECH_LOCALE[lang]} onText={apply} />
        <span className="muted text-[12px]">{t('voiceTripHint', lang)}</span>
      </div>

      {heard && (
        <div className="flex flex-col gap-1 text-[13px]" aria-live="polite">
          <span className="muted">«{heard}»</span>
          {applied.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {applied.map((part) => (
                // tag-flow: сюда попадает распознанный список городов и интересов
                <span key={part} className="tag tag-accent tag-flow">
                  {part}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--warn)' }}>{t('voiceTripNothing', lang)}</span>
          )}
        </div>
      )}
    </div>
  );
}
