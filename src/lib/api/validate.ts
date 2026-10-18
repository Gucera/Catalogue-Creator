import type { ZodError } from 'zod';

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export function badRequest(err: ZodError) {
  return Response.json(
    { error: 'Invalid request', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    { status: 400 }
  );
}
