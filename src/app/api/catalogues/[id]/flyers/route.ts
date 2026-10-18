import { z } from 'zod';
import { getCatalogue, store } from '@/lib/data/store';
import { flyersWithWarnings } from '@/lib/data/flyer-queries';
import { badRequest, readJson } from '@/lib/api/validate';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCatalogue(id)) return Response.json({ error: 'Catalogue not found' }, { status: 404 });
  return Response.json({ flyers: flyersWithWarnings(id) });
}

const Body = z.union([
  z.object({ order: z.array(z.string()).min(1) }),
  z.object({ id: z.string(), enabled: z.boolean() }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCatalogue(id)) return Response.json({ error: 'Catalogue not found' }, { status: 404 });
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  const s = store();
  const list = s.flyers[id];
  if ('order' in parsed.data) {
    const order = parsed.data.order;
    if (order.length !== list.length || !list.every((f) => order.includes(f.id))) {
      return Response.json({ error: 'Order must contain the same flyers' }, { status: 409 });
    }
    s.flyers[id] = order.map((fid) => list.find((f) => f.id === fid)!);
  } else {
    const { id: flyerId, enabled } = parsed.data;
    const f = list.find((x) => x.id === flyerId);
    if (!f) return Response.json({ error: 'Flyer not found' }, { status: 404 });
    f.enabled = enabled;
  }
  return Response.json({ flyers: flyersWithWarnings(id) });
}
