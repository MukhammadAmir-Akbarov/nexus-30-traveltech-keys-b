'use client';

import { useState } from 'react';
import { Icon, type IconName } from './Icon';
import { useTrip } from './TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';
import type { RequestKind } from '@/lib/types';

// Одна форма на оба сценария: «проблема на объекте» и «запросить гида».
// Разные они только заголовком и адресатом, поэтому двух компонентов не нужно.

const UI: Record<RequestKind, { title: UiKey; hint: UiKey; icon: IconName }> = {
  'place-problem': { title: 'reportProblem', hint: 'reportProblemHint', icon: 'alert' },
  'guide-booking': { title: 'bookGuide', hint: 'bookGuideHint', icon: 'user' },
};

/** Коды отправленных заявок. Аккаунта у туриста нет — статус ищем по ним. */
export const CODES_KEY = 'nexus30.requests';

export function RequestForm({ kind, targetId }: { kind: RequestKind; targetId: string }) {
  const { lang } = useTrip();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, targetId, message, contact }),
      });
      if (res.ok) {
        const data = (await res.json()) as { code?: string };
        setSent(true);
        if (data.code) {
          setCode(data.code);
          // Код кладём себе: у туриста нет аккаунта, а статус заявки он
          // должен видеть. В профиле по этим кодам подтягиваются ответы гидов.
          try {
            const saved = JSON.parse(localStorage.getItem(CODES_KEY) ?? '[]') as string[];
            localStorage.setItem(CODES_KEY, JSON.stringify([data.code, ...saved].slice(0, 20)));
          } catch {
            localStorage.setItem(CODES_KEY, JSON.stringify([data.code]));
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-1">
        <div className="tag tag-ok">
          <Icon name="check" size={14} />
          {t('formSent', lang)}
        </div>
        {code && (
          <div className="text-[12.5px]">
            {t('requestCode', lang)}: <b>{code}</b>
            <div className="muted">{t('requestCodeHint', lang)}</div>
          </div>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button className="chip" onClick={() => setOpen(true)}>
        <Icon name={UI[kind].icon} size={14} />
        {t(UI[kind].title, lang)}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="muted text-[12px]">{t(UI[kind].hint, lang)}</span>
      <textarea
        className="field min-h-20 text-[13px]"
        placeholder={t('formMessage', lang)}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        className="field text-[13px]"
        placeholder={t('formContact', lang)}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          disabled={busy || message.trim().length < 5 || contact.trim().length < 3}
          onClick={send}
        >
          {t('formSend', lang)}
        </button>
        <button className="chip" onClick={() => setOpen(false)}>
          {t('onbSkip', lang)}
        </button>
      </div>
    </div>
  );
}
