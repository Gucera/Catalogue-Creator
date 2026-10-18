'use client';

import { memo, useEffect, useSyncExternalStore } from 'react';
import { photoQueue, photoUrl } from '@/lib/photo-queue';

/** A product photo that loads through the shared queue. */
export const QueuedPhoto = memo(function QueuedPhoto({
  sku,
  alt,
  urgent = false,
  className,
}: {
  sku: string;
  alt: string;
  urgent?: boolean;
  className?: string;
}) {
  const url = photoUrl(sku);
  const entry = useSyncExternalStore(
    (fn) => photoQueue.subscribe(url, fn),
    () => photoQueue.get(url).state + '|' + (photoQueue.get(url).src ?? ''),
    () => 'queued|'
  );
  useEffect(() => photoQueue.request(url, urgent), [url, urgent]);
  const [state, src] = entry.split('|');

  if (state === 'loaded' && src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} data-photo="loaded" />;
  }
  if (state === 'missing') {
    return (
      <span className="text-[8px] text-zinc-400" data-photo="missing">
        No photo
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span className="text-[8px] font-medium text-rose-500" data-photo="failed">
        Photo failed
      </span>
    );
  }
  return <span className="skeleton block h-3/4 w-3/4 rounded" data-photo="pending" />;
});
