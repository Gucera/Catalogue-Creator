import { FlyersClient } from '@/components/flyers/FlyersClient';
import { flyersWithWarnings } from '@/lib/data/flyer-queries';

export const dynamic = 'force-dynamic';

export default async function FlyersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FlyersClient key={id} catalogueId={id} initial={flyersWithWarnings(id)} />;
}
