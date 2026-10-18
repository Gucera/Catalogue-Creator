import { productBySku } from '@/lib/data/store';
import { packshotSvg } from '@/lib/photos/packshot';

/**
 * Fake image service. Answers slowly and unevenly like a real photo host,
 * 404s for products without a photo and 500s for a "broken" one, so the
 * catalogue's photo loader has real work to do.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const p = productBySku(sku);
  const n = Number(sku.replace(/\D/g, '')) || 0;
  await new Promise((r) => setTimeout(r, 30 + ((n * 7919) % 200)));
  if (!p || p.photo === 'missing') return new Response('No photo', { status: 404 });
  if (p.photo === 'broken') return new Response('Upstream error', { status: 500 });
  return new Response(packshotSvg(p), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
