'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

const ERROR_KEY: Record<string, UiKey> = {
  invalid_credentials: 'authInvalid',
  too_many_attempts: 'authTooMany',
  taken_or_invalid: 'authTaken',
  weak_password: 'authWeak',
  forbidden: 'authForbidden',
};

export function LoginForm({ demo }: { demo: boolean }) {
  const { lang } = useTrip();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const params = useSearchParams();
  const router = useRouter();
  const urlError = params.get('error');
  const [submitError, setSubmitError] = useState<UiKey | null>(null);
  const errorKey = submitError ?? (urlError ? ERROR_KEY[urlError] ?? null : null);
  const setErrorKey = setSubmitError;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorKey(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; role?: string };
      if (!res.ok) {
        setErrorKey(ERROR_KEY[data.error ?? ''] ?? 'authInvalid');
        return;
      }
      const next = params.get('next');
      router.push(next ?? (data.role === 'admin' ? '/admin' : data.role === 'guide' ? '/guide' : '/'));
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      {/* slate-* — фиксированные серые: в тёмной теме заголовок и подписи
          остались бы тёмными на тёмной карточке. --text и --muted следуют теме */}
      <h1
        className="text-3xl font-extrabold text-center uppercase tracking-wider mb-2"
        style={{ color: 'var(--text)' }}
      >
        {mode === 'login' ? t('authLogin', lang) : t('authRegister', lang)}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label
          className="text-xs font-bold uppercase tracking-wide ml-4"
          style={{ color: 'var(--muted)' }}
          htmlFor="email"
        >
          {t('authEmail', lang)}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-full px-6 py-4 text-sm shadow-inner transition-shadow focus:outline-none"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label
          className="text-xs font-bold uppercase tracking-wide ml-4 mt-2"
          style={{ color: 'var(--muted)' }}
          htmlFor="password"
        >
          {t('authPassword', lang)}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full rounded-full px-6 py-4 text-sm shadow-inner transition-shadow focus:outline-none"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorKey && (
          <div className="text-[13px]" style={{ color: 'var(--danger)' }}>
            {t(errorKey, lang)}
          </div>
        )}

        {/*
          Цвета через токены, а не значениями. Здесь стояли bg-[#0E979D],
          text-white и hover:bg-teal-500 — тот самый акцент, но записанный
          числом, плюс чужая бирюза Tailwind в наведении.

          Две беды. В тёмной теме токен становится #2cb6bb, а вшитый цвет
          оставался прежним: кнопка выпадала из темы. И правка контраста
          (белый на акценте давал 3.54:1) до этой кнопки просто не дошла —
          она мимо токенов. Вход — один из первых экранов, которые увидит зал.
        */}
        <button className="w-full rounded-full bg-[var(--accent)] px-6 py-4 mt-4 text-sm font-bold uppercase tracking-widest text-[var(--on-accent)] shadow-[var(--shadow-2)] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50" disabled={loading}>
          {mode === 'login' ? t('authLogin', lang) : t('authRegister', lang)}
        </button>

        <button
          type="button"
          // text-teal-600 давал 3.74:1 на белом — ниже нормы; --accent-ink
          // это та же роль «акцент как текст на светлой подложке», 5.78:1
          className="text-sm text-[var(--accent-ink)] hover:text-[var(--accent)] self-center mt-2 transition-colors font-medium underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setErrorKey(null);
          }}
        >
          {mode === 'login' ? t('authNoAccount', lang) : t('authHaveAccount', lang)}
        </button>
      </form>

      {demo && <p className="muted text-[12px]">{t('authDemoHint', lang)}</p>}
    </div>
  );
}
