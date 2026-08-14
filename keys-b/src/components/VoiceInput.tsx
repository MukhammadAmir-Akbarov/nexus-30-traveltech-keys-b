'use client';

import { useEffect, useRef, useState } from 'react';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Голосовой ввод — штатный Web Speech API браузера.
// Библиотеку не ставим: нужен один вызов start/stop.
// ponytail: в Safari/Firefox API нет — кнопка просто скрывается, ввод остаётся текстовым.

type SpeechResult = { transcript: string };
type SpeechEvent = { results: ArrayLike<ArrayLike<SpeechResult>> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function createRecognition(): Recognition | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Impl = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Impl ? new Impl() : null;
}

export function VoiceInput({
  lang = 'ru-RU',
  onText,
}: {
  lang?: string;
  onText: (text: string) => void;
}) {
  const { lang: uiLang } = useTrip();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(createRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = createRecognition();
    if (!recognition) return;

    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      onText(text.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <button type="button" className="btn" onClick={toggle} aria-pressed={listening}>
      {listening ? t('voiceListening', uiLang) : t('voiceIdle', uiLang)}
    </button>
  );
}
