import { z } from 'zod';
import { store } from '@/lib/data/store';
import { badRequest, readJson } from '@/lib/api/validate';

const Focal = z.object({
  id: z.string().min(1).max(64),
  sku: z.string().trim().toUpperCase().regex(/^HL-\d{5}$/),
  title: z.string().max(120),
  size: z.string().max(40),
  eachPrice: z.number().nonnegative().nullable(),
  boxPrice: z.number().nonnegative().nullable(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.03).max(1),
  h: z.number().min(0.02).max(1),
  layout: z.enum(['stack', 'row', 'badge']),
  theme: z.enum(['paper', 'ink', 'sale', 'fresh']),
  showQr: z.boolean(),
  showBox: z.boolean(),
});
const Body = z.object({ focals: z.array(Focal).max(40) });

export async function GET(_req: Request, { params }: { params: Promise<{ flyerId: string }> }) {
  const { flyerId } = await params;
  const focals = store().focals[flyerId];
  if (!focals) return Response.json({ error: 'Flyer not found' }, { status: 404 });
  return Response.json({ focals });
}

/** Replace all focals of a flyer in one step (the swap is atomic in memory). */
export async function PUT(req: Request, { params }: { params: Promise<{ flyerId: string }> }) {
  const { flyerId } = await params;
  const s = store();
  if (!s.focals[flyerId]) return Response.json({ error: 'Flyer not found' }, { status: 404 });
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error);
  s.focals[flyerId] = parsed.data.focals;
  return Response.json({ ok: true, focals: parsed.data.focals });
}
