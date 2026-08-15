import { LoginForm } from './LoginForm';

// Признак «это правда демо-доступ» читается на сервере при каждом запросе.
// Через NEXT_PUBLIC_* это не работает: такие переменные вшиваются в бандл при
// сборке, и подсказка показывала пароль, который на запущенном сервере уже
// заменён своим — пользователь вводил написанное и получал «неверный пароль».
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const demo = !process.env.ADMIN_PASSWORD && !process.env.ADMIN_EMAIL;
  return <LoginForm demo={demo} />;
}
