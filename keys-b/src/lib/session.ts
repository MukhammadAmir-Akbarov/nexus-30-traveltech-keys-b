import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession, type Session } from './auth';

/** Текущая сессия из cookie (или null). Для серверных компонентов и роутов. */
export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Пускает дальше только администратора, остальных — на страницу входа. */
export async function requireAdmin(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect('/login?next=/admin');
  if (session.role !== 'admin') redirect('/login?error=forbidden');
  return session;
}

/** Гид видит только свою карточку — и никогда чужую. */
export async function requireGuide(): Promise<Session & { guideId: string }> {
  const session = await currentSession();
  if (!session) redirect('/login?next=/guide');
  if (session.role !== 'guide' || !session.guideId) redirect('/login?error=forbidden');
  return session as Session & { guideId: string };
}
