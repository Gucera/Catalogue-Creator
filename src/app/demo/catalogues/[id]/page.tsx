import { ProductsClient } from '@/components/catalogue/ProductsClient';
import { catalogueTree } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductsClient key={id} catalogueId={id} initial={catalogueTree(id)} />;
}
