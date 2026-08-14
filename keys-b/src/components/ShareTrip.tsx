'use client';

import QRCode from 'qrcode';
import { useState } from 'react';
import { useTrip } from './TripProvider';
import { Icon } from './Icon';
import { t } from '@/lib/i18n';

// Поделиться поездкой: контекст кодируется в ссылку, по ней маршрут
// восстанавливается один в один. Нужен одиночке (отправить близким)
// и вообще всем, кто планирует вдвоём с разных телефонов.

export function ShareTrip() {
  const { trip, lang } = useTrip();
  const [qr, setQr] = useState('');
  const [url, setUrl] = useState('');

  const share = async () => {
    const encoded = btoa(encodeURIComponent(JSON.stringify(trip)));
    const link = `${location.origin}/plan?trip=${encoded}`;
    setUrl(link);
    setQr(await QRCode.toDataURL(link, { margin: 1, width: 280 }));
  };

  return (
    <section className="card flex flex-col items-start gap-3">
      <button className="btn" onClick={share}>
        <Icon name='share' />
        {t('shareTrip', lang)}
      </button>

      {qr && (
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR" width={140} height={140} />
          <div className="flex flex-col gap-2">
            <input readOnly className="field min-w-64 text-[12px]" value={url} />
            <button className="chip self-start" onClick={() => navigator.clipboard.writeText(url)}>
              {t('shareCopy', lang)}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
