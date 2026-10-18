import { notFound } from 'next/navigation';
import { CatalogueNav } from '@/components/nav/CatalogueNav';
import { CATALOGUES, getCatalogue } from '@/lib/data/store';

export default async function CatalogueLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogue = getCatalogue(id);
  if (!catalogue) notFound();
  return (
    <>
      <CatalogueNav catalogue={catalogue} catalogues={CATALOGUES} />
      {children}
    </>
  );
}
