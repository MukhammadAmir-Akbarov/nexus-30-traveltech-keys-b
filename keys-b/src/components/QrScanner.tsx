'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';

// Сканер QR — на штатном BarcodeDetector браузера, без библиотек распознавания.
// ponytail: где API нет (Safari, Firefox), кнопка скрывается — у объекта всегда
// остаётся обычная ссылка под кодом.

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

function createDetector(): Detector | null {
  const w = window as unknown as {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  };
  return w.BarcodeDetector ? new w.BarcodeDetector({ formats: ['qr_code'] }) : null;
}

export function QrScanner() {
  const { lang } = useTrip();
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(Boolean(createDetector()) && Boolean(navigator.mediaDevices?.getUserMedia));
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const detector = createDetector();
    if (!detector) return;

    let stopped = false;
    const tick = async () => {
      if (stopped || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const url = codes[0]?.rawValue;
        if (url) {
          stopped = true;
          stop();
          // в коде лежит ссылка на карточку объекта этого же приложения
          const path = url.startsWith('http') ? new URL(url).pathname : url;
          router.push(path);
        }
      } catch {
        // кадр не распознан — просто ждём следующий
      }
    };

    const timer = setInterval(tick, 400);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [scanning, router]);

  if (!supported) return null;

  async function start() {
    setError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setError(true);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn" onClick={() => (scanning ? stop() : start())}>
        {scanning ? t('qrStop', lang) : t('qrScan', lang)}
      </button>
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full max-w-xs rounded-xl"
        style={{ display: scanning ? 'block' : 'none' }}
      />
      {error && (
        <div className="text-[13px]" style={{ color: 'var(--danger)' }}>
          {t('qrCameraError', lang)}
        </div>
      )}
    </div>
  );
}
