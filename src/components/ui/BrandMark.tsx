import { brandMarkSvg } from '@/lib/brand';

/** The fictional wholesaler's mark. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: brandMarkSvg(size) }}
    />
  );
}

export function BrandLockup({ light = false, size = 32 }: { light?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandMark size={size} />
      <span className="leading-none">
        <span className={`block font-serif text-[1.15em] font-bold ${light ? 'text-white' : 'text-[#173a5e]'}`}>Harbourline</span>
        <span className={`block text-[0.55em] font-semibold tracking-[0.3em] ${light ? 'text-white/70' : 'text-zinc-500'}`}>WHOLESALE</span>
      </span>
    </span>
  );
}
