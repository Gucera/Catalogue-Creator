'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/ui/BrandMark';

const LINKS = [
  { href: '/demo', label: 'Dashboard', match: (p: string) => p === '/demo' },
  { href: '/demo/catalogues/main', label: 'Catalogues', match: (p: string) => p.startsWith('/demo/catalogues') },
  { href: '/demo/compress', label: 'Compress PDF', match: (p: string) => p.startsWith('/demo/compress') },
];

/** Global top bar of the demo portal. Hidden in the full-screen flyer editor and in print. */
export function PortalNav() {
  const path = usePathname() ?? '';
  if (/\/flyers\/[^/]+$/.test(path)) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link href="/demo" className="flex items-center gap-2">
          <BrandMark size={28} />
          <span className="text-sm font-semibold text-zinc-900">
            Harbourline <span className="font-normal text-zinc-500">Sales Portal</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          {LINKS.map((l) => {
            const active = l.match(path);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
            ← Back to case study
          </Link>
          <span className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 text-xs text-zinc-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#173a5e] text-[10px] font-bold text-white">DU</span>
            Demo user · Manager
          </span>
        </div>
      </div>
    </header>
  );
}
