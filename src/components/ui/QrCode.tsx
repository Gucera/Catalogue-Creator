'use client';

import { memo, useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * QR code as one SVG path (one rect per dark module would be thousands of
 * nodes on a catalogue). Error correction M, quiet zone of one module.
 */
export const QrCode = memo(function QrCode({ value, className }: { value: string; className?: string }) {
  const { d, size } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    let path = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(x, y)) path += `M${x + 1} ${y + 1}h1v1h-1z`;
      }
    }
    return { d: path, size: n + 2 };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering="crispEdges" aria-label={`QR code ${value}`} role="img">
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
});
