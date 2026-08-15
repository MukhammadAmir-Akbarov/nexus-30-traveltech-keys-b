'use client';

import { useEffect, useState } from 'react';
import { useTrip } from './TripProvider';
import { useBrowserSupport } from '@/lib/use-browser-support';
import { Icon } from './Icon';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

// Озвучка карточки объекта штатным синтезом речи браузера.
// Нужна у самого объекта: телефон в кармане, слушаешь и смотришь на памятник,
// а не в экран. Библиотеки не нужны — это один вызов speechSynthesis.

const VOICE_LOCALE: Record<Lang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export function SpeakButton({ text }: { text: string }) {
  const { lang } = useTrip();
  const supported = useBrowserSupport(() => 'speechSynthesis' in window);
  const [speaking, setSpeaking] = useState(false);

  // эффект остался только ради уборки: остановить речь при уходе со страницы
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LOCALE[lang];
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button type="button" className="chip" onClick={toggle} aria-pressed={speaking}>
      <Icon name={speaking ? 'stop' : 'volume'} size={16} />
      {speaking ? t('speakStop', lang) : t('speakStart', lang)}
    </button>
  );
}
