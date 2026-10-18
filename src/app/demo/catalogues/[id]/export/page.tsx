import { notFound } from 'next/navigation';
import { ExportClient } from '@/components/catalogue/ExportClient';
import { catalogueTree, getCatalogue, store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogue = getCatalogue(id);
  if (!catalogue) notFound();
  const s = store();
  const flyers = (s.flyers[id] ?? []).filter((f) => f.enabled).map((flyer) => ({ flyer, focals: s.focals[flyer.id] ?? [] }));
  return <ExportClient catalogue={{ id, name: catalogue.name }} categories={catalogueTree(id)} flyers={flyers} />;
}
