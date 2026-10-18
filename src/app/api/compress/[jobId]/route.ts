import { jobStatus } from '@/lib/compress/jobs';

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const status = jobStatus(jobId);
  if (!status) return Response.json({ error: 'Job not found or expired' }, { status: 404 });
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
