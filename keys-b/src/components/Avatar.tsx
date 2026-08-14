// Демо-аватар: инициалы на детерминированном фоне.
// Реальных фотографий гидов у нас нет и выдумывать их нельзя —
// в проде сюда придёт фото из профиля гида.
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  // стабильный оттенок из имени
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size / 2.6,
        background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 45% 30%))`,
        color: '#fff',
      }}
    >
      {initials}
    </div>
  );
}
