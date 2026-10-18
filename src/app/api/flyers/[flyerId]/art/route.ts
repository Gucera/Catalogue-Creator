import { FLYER_SEEDS } from '@/lib/data/flyers';
import { flyerArtSvg } from '@/lib/flyer/art';

export async function GET(_req: Request, { params }: { params: Promise<{ flyerId: string }> }) {
  const { flyerId } = await params;
  const flyer = FLYER_SEEDS.find((f) => f.id === flyerId);
  if (!flyer) return new Response('Not found', { status: 404 });
  return new Response(flyerArtSvg(flyer.art), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
