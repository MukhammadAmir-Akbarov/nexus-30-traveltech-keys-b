import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Аутентификация без внешних библиотек: пароль хранится как scrypt-хэш,
// сессия — подписанная HMAC cookie. Для прототипа этого достаточно,
// в проде здесь будет провайдер identity.

export type Role = 'admin' | 'user' | 'guide';
/** guideId есть только у роли guide — по нему открывается его собственная страница. */
export type Session = { email: string; role: Role; guideId?: string; exp: number };

export const SESSION_COOKIE = 'nexus30_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  // без переменной окружения работаем, но подпись предсказуема — только для локального демо
  return 'nexus30-dev-secret-do-not-use-in-production';
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

// --- пароли ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  // постоянное по времени сравнение, чтобы не подбирать хэш по задержке
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// --- защита входа от перебора ---
// Публичная ссылка плюс восьмизначный пароль подбираются скриптом за часы.
// Полноценный rate-limit здесь не нужен, нужен потолок попыток по ключу.

const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

/** Ключ — почта плюс адрес: чтобы чужой перебор не запирал владельцу его же аккаунт. */
export function loginKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}

export function isLockedOut(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < LOCKOUT_MS);
  attempts.set(key, recent);
  return recent.length >= MAX_ATTEMPTS;
}

export function noteFailedLogin(key: string, now = Date.now()): void {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < LOCKOUT_MS);
  attempts.set(key, [...recent, now]);
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}

// --- сессии ---

export function signSession(session: Omit<Session, 'exp'>, now = Date.now()): string {
  const payload: Session = { ...session, exp: now + SESSION_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifySession(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    if (!session.exp || session.exp < now) return null;
    return session;
  } catch {
    return null;
  }
}
