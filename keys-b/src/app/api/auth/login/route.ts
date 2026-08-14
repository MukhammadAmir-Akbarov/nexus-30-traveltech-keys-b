import { cookies } from 'next/headers';
import { SESSION_COOKIE, signSession } from '@/lib/auth';
import { authenticate } from '@/lib/store';

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  const user = email && password ? authenticate(email, password) : null;
  if (!user) {
    // одна формулировка на оба случая: не подсказываем, существует ли аккаунт
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession({ email: user.email, role: user.role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ email: user.email, role: user.role });
}
