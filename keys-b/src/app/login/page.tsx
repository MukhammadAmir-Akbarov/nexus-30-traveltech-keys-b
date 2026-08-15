import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const demo = !process.env.ADMIN_PASSWORD && !process.env.ADMIN_EMAIL;
  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--bg)' }}>
      {/*
        Картинка своя, из public/places. Здесь стояла ссылка на Unsplash —
        внешний адрес на первом же экране. В зале, где WiFi падает, вход
        встретил бы жюри пустой белой половиной, и это при том, что весь
        остальной продукт умеет работать без сети: одиннадцать фотографий
        специально скачаны в репозиторий именно ради этого.

        Регистан — CC BY 2.0, Gustavo Jeronimo; автор и лицензия уже указаны
        на /how вместе с остальными снимками (src/data/photos.ts).
      */}
      <div
        className="hidden md:block md:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/photos/registan.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      <div
        className="w-full md:w-1/2 flex items-center justify-center p-8 md:-ml-6 md:rounded-l-[40px] z-10 relative"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-2)' }}
      >
        <LoginForm demo={demo} />
      </div>
    </div>
  );
}
