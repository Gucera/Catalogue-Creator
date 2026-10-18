import { notFound } from 'next/navigation';
import { FocalEditor } from '@/components/flyers/FocalEditor';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export default async function FocalEditorPage({ params }: { params: Promise<{ id: string; flyerId: string }> }) {
  const { id, flyerId } = await params;
  const s = store();
  const flyer = s.flyers[id]?.find((f) => f.id === flyerId);
  if (!flyer) notFound();
  return <FocalEditor catalogueId={id} flyer={flyer} initial={s.focals[flyerId] ?? []} />;
}
