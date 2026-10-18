import { allProducts } from '@/lib/data/store';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
  if (q.length < 2) return Response.json({ products: [] });
  const words = q.split(/\s+/);
  const products = allProducts()
    .filter((p) => words.every((w) => p.title.toLowerCase().includes(w) || p.sku.toLowerCase().includes(w)))
    .slice(0, 12)
    .map(({ sku, title, size, eachPrice, boxPrice, status }) => ({ sku, title, size, eachPrice, boxPrice, status }));
  // A little latency so the debounce + stale-response guard matter.
  await new Promise((r) => setTimeout(r, 120));
  return Response.json({ products });
}
