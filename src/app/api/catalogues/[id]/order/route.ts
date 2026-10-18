import { z } from 'zod';
import { getCatalogue, store } from '@/lib/data/store';
import { badRequest, readJson } from '@/lib/api/validate';

const Body = z.union([
  z.object({ categoryIds: z.array(z.number().int()).min(1) }),
  z.object({ categoryId: z.number().int(), subcategoryIds: z.array(z.number().int()).min(1) }),
]);

const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Save a new folder order. The new order must be a permutation of the old one. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCatalogue(id)) return Response.json({ error: 'Catalogue not found' }, { status: 404 });
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const s = store();
  const body = parsed.data;
  if ('categoryIds' in body) {
    if (!sameSet(body.categoryIds, s.categoryOrder[id])) return Response.json({ error: 'Order must contain the same folders' }, { status: 409 });
    s.categoryOrder[id] = body.categoryIds;
  } else {
    const current = s.subOrder[id][body.categoryId];
    if (!current || !sameSet(body.subcategoryIds, current)) return Response.json({ error: 'Order must contain the same folders' }, { status: 409 });
    s.subOrder[id][body.categoryId] = body.subcategoryIds;
  }
  s.updatedAt = Date.now();
  return Response.json({ ok: true });
}
