import { writeFile } from 'node:fs/promises';
import { samplePdf } from '@/lib/compress/sample-pdf';
import { enqueueJob, newJobPaths } from '@/lib/compress/jobs';
import { parseTarget } from '@/lib/compress/params';

export const runtime = 'nodejs';

/** Download the generated sample catalogue. */
export async function GET() {
  const bytes = await samplePdf();
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="harbourline-sample-catalogue.pdf"',
    },
  });
}

/** Start a job on the sample without a round trip through the browser. */
export async function POST(req: Request) {
  const bytes = await samplePdf();
  const { id, inputPath, outputPath } = await newJobPaths();
  await writeFile(inputPath, bytes);
  const status = await enqueueJob({
    id,
    inputPath,
    outputPath,
    fileName: 'harbourline-sample-catalogue.pdf',
    inputBytes: bytes.length,
    targetBytes: parseTarget(new URL(req.url).searchParams.get('targetMb')),
  });
  return Response.json(status, { status: 202 });
}
