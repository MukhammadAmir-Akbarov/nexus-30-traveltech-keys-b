'use client';

import Image from 'next/image';
import { photoFor } from '@/data/photos';
import { t } from '@/lib/i18n';
import { Icon } from './Icon';
import type { Lang } from '@/lib/types';

/**
 * Фотография объекта.
 *
 * У двух объектов из тридцати одного подходящего снимка на Викискладе нет.
 * Там показывается заглушка, а не похожая картинка другого места: подставить
 * «примерно то же» в приложении про достоверность было бы смешно.
 *
 * `credit` — показывать ли автора и лицензию. На карточке объекта показываем
 * обязательно, в списках подпись стоит один раз внизу страницы, иначе она
 * заслоняет сами карточки.
 */
export function PlacePhoto({
  placeId,
  alt,
  lang,
  ratio = 16 / 9,
  credit = false,
  priority = false,
  sizes = '(max-width: 640px) 100vw, 400px',
}: {
  placeId: string;
  alt: string;
  lang: Lang;
  ratio?: number;
  credit?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const photo = photoFor(placeId);

  if (!photo) {
    return (
      <div className="photo-empty" style={{ aspectRatio: ratio }}>
        <Icon name="pin" size={22} />
        <span className="text-[12px]">{t('photoNone', lang)}</span>
      </div>
    );
  }

  return (
    <figure className="flex flex-col gap-1">
      <div className="photo-frame" style={{ aspectRatio: ratio }}>
        <Image
          src={photo.url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="photo-img"
        />
      </div>
      {credit && (
        <figcaption className="muted text-[11.5px]">
          {t('photoCredit', lang)}: {photo.author} · {photo.license} ·{' '}
          <a
            href={photo.page}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: 'var(--accent-ink)' }}
          >
            {t('photoSource', lang)}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
