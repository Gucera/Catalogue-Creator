import { readFile } from 'node:fs/promises';
import { jobOutputPath, jobStatus } from '@/lib/compress/jobs';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const file = jobOutputPath(jobId);
  const status = jobStatus(jobId);
  if (!file || !status) return Response.json({ error: 'Not ready or expired' }, { status: 404 });
  const name = status.fileName.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '-') + '-compressed.pdf';
  return new Response(new Uint8Array(await readFile(file)), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"` },
  });
}
