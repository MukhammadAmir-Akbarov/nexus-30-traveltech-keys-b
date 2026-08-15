import QRCode from 'qrcode';
import { headers } from 'next/headers';
import { PLACES } from '@/data/places';

// Лист QR-кодов для печати: их клеят у входа на объект, турист сканирует и
// попадает на карточку с проверкой фактов. Коды генерируются на сервере,
// без внешних сервисов — печать не должна зависеть от чужого API.

export const metadata = { title: 'QR · TurizmHamroh' };

// Адрес берём из запроса, а не из переменной сборки: NEXT_PUBLIC_* вшивается
// при билде, и распечатанные коды вели бы на localhost с любого адреса.
export const dynamic = 'force-dynamic';

async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
}

export default async function QrPage() {
  const head = await headers();
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'localhost:3000';
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;

  const codes = await Promise.all(
    PLACES.map(async (place) => ({
      place,
      url: `${base}/place/${place.id}`,
      image: await qrDataUrl(`${base}/place/${place.id}`),
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="no-print">
        <h1 className="text-xl font-bold">QR</h1>
        <p className="muted mt-1 text-sm">
          Obyektlar uchun QR-kodlar · QR-коды объектов · QR codes for the places
        </p>
        <p className="muted mt-1 text-[12px]">{base}</p>
      </section>

      <section className="qr-sheet grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map(({ place, url, image }) => (
          <article key={place.id} className="card flex flex-col items-center gap-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={place.name.uz} width={160} height={160} />
            <div className="text-sm font-semibold">{place.name.uz}</div>
            <div className="muted text-[12px]">{place.name.ru}</div>
            <a href={url} className="no-print text-[12px] underline" style={{ color: 'var(--accent)' }}>
              /place/{place.id}
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
