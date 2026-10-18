import { z } from 'zod';

const TargetMb = z.coerce.number().min(0.5).max(200).catch(10);

/** Target size from a `targetMb` query value; falls back to 10 MB. */
export function parseTarget(raw: string | null): number {
  return Math.round(TargetMb.parse(raw ?? undefined) * 1024 * 1024);
}
