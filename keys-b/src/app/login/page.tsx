import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const demo = !process.env.ADMIN_PASSWORD && !process.env.ADMIN_EMAIL;
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div 
        className="hidden md:block md:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070')" }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white md:-ml-6 md:rounded-l-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-10 relative">
        <LoginForm demo={demo} />
      </div>
    </div>
  );
}
