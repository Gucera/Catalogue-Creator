import Link from 'next/link';
import { CATALOGUES, catalogueTree } from '@/lib/data/store';
import { flyersWithWarnings } from '@/lib/data/flyer-queries';
import { Icon, type IconName } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

const TRY: Array<{ icon: IconName; title: string; text: string; href: string }> = [
  { icon: 'printer', title: 'Build the PDF', text: 'Change the grid, turn dividers on and off, pick a cover. Pages re-pack instantly; then Save as PDF.', href: '/demo/catalogues/main/export' },
  { icon: 'image', title: 'Edit a flyer', text: 'Search a product, drop it on the poster, drag it until the guides snap. Undo with Ctrl+Z.', href: '/demo/catalogues/main/flyers/fl-grill' },
  { icon: 'grip', title: 'Reorder the catalogue', text: 'Drag folders (or use the keyboard) and save. The export follows the new order.', href: '/demo/catalogues/main' },
  { icon: 'download', title: 'Compress a PDF', text: 'Run the bundled sample or your own PDF and watch the job report its phases.', href: '/demo/compress' },
];

export default function Dashboard() {
  const rows = CATALOGUES.map((c) => {
    const tree = catalogueTree(c.id);
    const products = tree.reduce((n, cat) => n + cat.subcategories.reduce((m, s) => m + s.products.length, 0), 0);
    const flyers = flyersWithWarnings(c.id);
    return { ...c, categories: tree.length, products, flyers: flyers.length, warnings: flyers.filter((f) => f.warnings.length > 0).length };
  });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <b>Demo portal.</b> The company, products, prices and photos are made up. Changes you make are kept in server memory and reset when the server restarts.
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Welcome back</h1>
      <p className="text-sm text-zinc-500">Catalogues and print material for the sales team.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {rows.map((c) => (
          <Link key={c.id} href={`/demo/catalogues/${c.id}`} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-zinc-900">{c.name}</p>
                <p className="text-sm text-zinc-500">{c.description}</p>
              </div>
              {c.kind === 'price-list' ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">price list</span> : null}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Products</dt>
                <dd className="text-xl font-semibold text-zinc-900">{c.products}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Categories</dt>
                <dd className="text-xl font-semibold text-zinc-900">{c.categories}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Flyers</dt>
                <dd className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
                  {c.flyers}
                  {c.warnings > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 px-1.5 text-[11px] font-semibold text-rose-700">
                      <Icon name="warning" className="h-3 w-3" /> {c.warnings}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-center gap-1 text-sm font-medium text-zinc-900">
              Open <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">Things to try</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRY.map((t) => (
          <Link key={t.title} href={t.href} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Icon name={t.icon} />
            </span>
            <p className="mt-3 font-semibold text-zinc-900">{t.title}</p>
            <p className="mt-1 text-sm text-zinc-600">{t.text}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
