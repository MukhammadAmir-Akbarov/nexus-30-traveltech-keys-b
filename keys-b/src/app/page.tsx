'use client';

import Link from 'next/link';
import { useTrip } from '@/components/TripProvider';
import { REGION_LABEL } from '@/data/places';
import { INTEREST_LABEL, INTERESTS, TRAVEL_TYPES, TRAVEL_TYPE_LABEL } from '@/lib/labels';
import type { Interest, Region } from '@/lib/types';

const REGIONS: (Region | 'all')[] = [
  'all',
  'samarkand',
  'bukhara',
  'khiva',
  'tashkent',
  'shakhrisabz',
  'nurata',
];

export default function Home() {
  const { trip, update } = useTrip();

  const toggleInterest = (interest: Interest) => {
    const has = trip.interests.includes(interest);
    update({
      interests: has
        ? trip.interests.filter((i) => i !== interest)
        : [...trip.interests, interest],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h1 className="text-2xl font-bold">Надёжный спутник туриста</h1>
        <p className="muted mt-1 max-w-2xl text-sm">
          Один контекст поездки — три функции: проверка того, что рассказывает гид,
          персональный маршрут по Узбекистану и подбор подходящего гида.
        </p>
      </section>

      <section className="card flex flex-col gap-5">
        <div>
          <div className="mb-2 text-sm font-semibold">Регион</div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                className="chip"
                data-active={trip.region === region}
                onClick={() => update({ region })}
              >
                {region === 'all' ? 'Весь Узбекистан' : REGION_LABEL[region]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">Интересы</div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                className="chip"
                data-active={trip.interests.includes(interest)}
                onClick={() => toggleInterest(interest)}
              >
                {INTEREST_LABEL[interest]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">Формат поездки</div>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TYPES.map((type) => (
                <button
                  key={type}
                  className="chip"
                  data-active={trip.travelType === type}
                  onClick={() => update({ travelType: type })}
                >
                  {TRAVEL_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Дней: {trip.days}</div>
            <input
              type="range"
              min={1}
              max={7}
              value={trip.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="w-48 accent-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/check" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">1 · Проверка фактов</div>
          <p className="muted mt-1 text-[13px]">
            Гид что-то сказал — проверьте по официальным источникам голосом или текстом.
          </p>
        </Link>
        <Link href="/plan" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">2 · Маршрут</div>
          <p className="muted mt-1 text-[13px]">
            Маршрут по дням с картой, собранный под ваш формат поездки и интересы.
          </p>
        </Link>
        <Link href="/guides" className="card transition hover:opacity-85">
          <div className="text-sm font-semibold">3 · Гиды</div>
          <p className="muted mt-1 text-[13px]">
            Подбор гида под маршрут, язык и формат с объяснением, почему именно он.
          </p>
        </Link>
      </section>
    </div>
  );
}
