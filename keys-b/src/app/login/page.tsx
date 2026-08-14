'use client';

import { useEffect, useState } from 'react';
import { useTrip } from '@/components/TripProvider';
import { t } from '@/lib/i18n';
import type { UiKey } from '@/lib/i18n';

const ERROR_KEY: Record<string, UiKey> = {
  invalid_credentials: 'authInvalid',
  taken_or_invalid: 'authTaken',
  weak_password: 'authWeak',
  forbidden: 'authForbidden',
};

export default function LoginPage() {
  const { lang } = useTrip();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<UiKey | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error && ERROR_KEY[error]) setErrorKey(ERROR_KEY[error]);
  }, []);

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
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next ?? (data.role === 'admin' ? '/admin' : '/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-bold">
        {mode === 'login' ? t('authLogin', lang) : t('authRegister', lang)}
      </h1>

      <form className="card flex flex-col gap-3" onSubmit={submit}>
        <label className="text-sm font-semibold" htmlFor="email">
          {t('authEmail', lang)}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm font-semibold" htmlFor="password">
          {t('authPassword', lang)}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorKey && (
          <div className="text-[13px]" style={{ color: 'var(--danger)' }}>
            {t(errorKey, lang)}
          </div>
        )}

        <button className="btn btn-primary" disabled={loading}>
          {mode === 'login' ? t('authLogin', lang) : t('authRegister', lang)}
        </button>

        <button
          type="button"
          className="chip self-start"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setErrorKey(null);
          }}
        >
          {mode === 'login' ? t('authNoAccount', lang) : t('authHaveAccount', lang)}
        </button>
      </form>

      <p className="muted text-[12px]">{t('authDemoHint', lang)}</p>
    </div>
  );
}
