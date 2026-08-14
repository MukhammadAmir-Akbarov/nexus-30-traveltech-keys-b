import QRCode from 'qrcode';
import { PLACES } from '@/data/places';

// Лист QR-кодов для печати: на демо их клеят «у объектов», турист сканирует
// и попадает на карточку. Коды генерируются на сервере, без внешних сервисов.

export const metadata = { title: 'QR · TurizmHamroh' };

async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
}

export default async function QrPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const codes = await Promise.all(
    PLACES.map(async (place) => ({
      place,
      url: `${base}/place/${place.id}`,
      image: await qrDataUrl(`${base}/place/${place.id}`),
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-bold">QR</h1>
        <p className="muted mt-1 text-sm">
          Obyektlar uchun QR-kodlar · QR-коды объектов · QR codes for the places
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map(({ place, url, image }) => (
          <article key={place.id} className="card flex flex-col items-center gap-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={place.name.uz} width={160} height={160} />
            <div className="text-sm font-semibold">{place.name.uz}</div>
            <div className="muted text-[12px]">{place.name.ru}</div>
            <a
              href={url}
              className="text-[12px] underline"
              style={{ color: 'var(--accent)' }}
            >
              /place/{place.id}
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
