import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  clearLoginAttempts,
  isLockedOut,
  loginKey,
  noteFailedLogin,
  signSession,
} from '@/lib/auth';
import { authenticate } from '@/lib/store';
import { readJson } from '../../_schema';

export async function POST(req: Request) {
  /*
   * Только защита разбора. Ответы намеренно не трогаем: пустое тело
   * по-прежнему даёт 401 «invalid_credentials», а не 400 с указанием
   * недостающего поля. Одна формулировка на все случаи не подсказывает,
   * существует ли аккаунт, — это защита от перебора почт.
   */
  const body = await readJson(req);
  if (!body.ok) return body.response;

  const { email, password } = body.data as { email?: string; password?: string };

  // за туннелем и за прокси реальный адрес приходит заголовком
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const key = loginKey(email ?? '', ip);

  if (isLockedOut(key)) {
    // отвечаем раньше проверки пароля: перебор не должен даже доходить до scrypt
    return Response.json({ error: 'too_many_attempts' }, { status: 429 });
  }

  const user = email && password ? authenticate(email, password) : null;
  if (!user) {
    noteFailedLogin(key);
    // одна формулировка на оба случая: не подсказываем, существует ли аккаунт
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  clearLoginAttempts(key);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession({ email: user.email, role: user.role, guideId: user.guideId }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ email: user.email, role: user.role });
}
