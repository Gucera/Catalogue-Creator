import { productBySku } from '@/lib/data/store';

export async function GET(req: Request) {
  const skus = (new URL(req.url).searchParams.get('skus') ?? '').split(',').filter(Boolean).slice(0, 50);
  const prices = Object.fromEntries(
    skus.map((sku) => {
      const p = productBySku(sku);
      return [sku, p ? { title: p.title, size: p.size, eachPrice: p.eachPrice, boxPrice: p.boxPrice, status: p.status } : null];
    })
  );
  return Response.json({ prices });
}
