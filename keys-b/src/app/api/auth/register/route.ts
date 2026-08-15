import { cookies } from 'next/headers';
import { SESSION_COOKIE, signSession } from '@/lib/auth';
import { createUser } from '@/lib/store';
import { readJson } from '../../_schema';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body.ok) return body.response;

  const { email, password } = body.data as { email?: string; password?: string };
  if (!email || !password) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'weak_password' }, { status: 400 });
  }

  const user = createUser(email, password, 'user');
  if (!user) return Response.json({ error: 'taken_or_invalid' }, { status: 409 });

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
