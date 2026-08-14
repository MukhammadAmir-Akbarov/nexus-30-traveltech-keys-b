'use client';

import { useEffect, useRef, useState } from 'react';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Голосовой ввод — штатный Web Speech API браузера, библиотеку не ставим.
//
// Отзыв (запись 4): «gid uzoq gapiradi, ikki minut gapirgani» — гид говорит
// минуту-две, поэтому запись непрерывная: браузер обрывает распознавание на
// паузе, мы его молча перезапускаем и копим текст до нажатия «Стоп».
//
// ponytail: в Safari/Firefox API нет — кнопка скрывается, остаётся текстовый ввод.

const MAX_SECONDS = 180; // страховка, чтобы забытая запись не шла вечно

type SpeechAlternative = { transcript: string };
type SpeechResult = ArrayLike<SpeechAlternative> & { isFinal: boolean };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
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
  const [seconds, setSeconds] = useState(0);
  const [partial, setPartial] = useState('');

  const recognitionRef = useRef<Recognition | null>(null);
  const finalTextRef = useRef('');
  const stoppingRef = useRef(false);

  useEffect(() => {
    setSupported(Boolean(createRecognition()));
    return () => {
      stoppingRef.current = true;
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!listening) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [listening]);

  useEffect(() => {
    if (listening && seconds >= MAX_SECONDS) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, listening]);

  if (!supported) return null;

  function start() {
    const recognition = createRecognition();
    if (!recognition) return;

    finalTextRef.current = '';
    stoppingRef.current = false;
    setPartial('');
    setSeconds(0);

    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalTextRef.current += `${text} `;
        else interim += text;
      }
      setPartial(interim);
    };

    // браузер обрывает распознавание на паузе — продолжаем, пока не нажали «Стоп»
    recognition.onend = () => {
      if (stoppingRef.current) {
        setListening(false);
        const full = `${finalTextRef.current} ${partial}`.trim();
        if (full) onText(full);
        setPartial('');
        return;
      }
      try {
        recognition.start();
      } catch {
        setListening(false);
      }
    };
    recognition.onerror = () => {
      if (!stoppingRef.current) return; // временная ошибка — onend перезапустит
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="btn"
        onClick={() => (listening ? stop() : start())}
        aria-pressed={listening}
      >
        {listening ? `${t('voiceListening', uiLang)} ${mmss}` : t('voiceIdle', uiLang)}
      </button>
      {listening && (
        <div className="muted text-[13px]">
          {(finalTextRef.current + partial).trim() || t('voiceHint', uiLang)}
        </div>
      )}
    </div>
  );
}
