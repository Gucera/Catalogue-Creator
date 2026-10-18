import Link from 'next/link';
import { catalogueTree, store } from '@/lib/data/store';
import { HeroPages } from '@/components/case-study/HeroPages';
import { PackingDiagram } from '@/components/case-study/PackingDiagram';
import { FocalView } from '@/components/flyers/FocalView';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PROFILE } from '@/lib/profile';
import { CASE_STUDY_FACTS } from '@/lib/case-study-facts';

export const dynamic = 'force-dynamic';

function Section({ id, eyebrow, title, intro, children, dark = false }: { id?: string; eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode; dark?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-16 px-5 py-20 sm:px-8 ${dark ? 'bg-[#0d1b2e] text-zinc-100' : ''}`}>
      <div className="mx-auto max-w-6xl">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-[#e9b44c]' : 'text-[#b4532a]'}`}>{eyebrow}</p>
        <h2 className={`mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl ${dark ? 'text-white' : 'text-zinc-900'}`}>{title}</h2>
        {intro ? <div className={`mt-4 max-w-3xl text-lg leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>{intro}</div> : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-zinc-600">{children}</p>
    </div>
  );
}

function TryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700">
      {children} <Icon name="arrowRight" className="h-4 w-4" />
    </Link>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800">{children}</code>;
}

const FEATURE_NAV: Array<{ href: string; icon: IconName; label: string }> = [
  { href: '#engine', icon: 'layout', label: 'Layout engine' },
  { href: '#flyers', icon: 'image', label: 'Flyer editor' },
  { href: '#photos', icon: 'pages', label: 'Photo loader' },
  { href: '#compress', icon: 'download', label: 'PDF compression' },
];

export default function CaseStudyPage() {
  const tree = catalogueTree('main');
  const s = store();
  const grill = s.flyers.main.find((f) => f.id === 'fl-grill')!;
  const heroFlyer = { flyer: grill, focals: s.focals[grill.id] };
  const pantry = s.focals['fl-pantry'] ?? [];
  const sampleFocal = pantry[0];

  return (
    <div className="bg-[#faf8f4] text-zinc-900">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1b2e]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <a href="#top" className="font-serif text-lg font-semibold text-white">
            Catalogue Studio
          </a>
          <nav className="hidden items-center gap-5 text-sm text-zinc-300 md:flex" aria-label="Sections">
            {FEATURE_NAV.map((f) => (
              <a key={f.href} href={f.href} className="hover:text-white">
                {f.label}
              </a>
            ))}
            <a href="#architecture" className="hover:text-white">
              Architecture
            </a>
          </nav>
          <Link href="/demo" className="ml-auto rounded-full bg-[#e9b44c] px-4 py-1.5 text-sm font-semibold text-[#0d1b2e] hover:bg-[#f2c56a]">
            Open the demo
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="relative overflow-hidden bg-[#0d1b2e] px-5 pb-20 pt-16 text-white sm:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60% 50% at 75% 30%, #24507e 0%, transparent 70%), radial-gradient(40% 40% at 10% 90%, #1f6f78 0%, transparent 70%)' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e9b44c]">Case study · Front-end focused full-stack</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">
              A print-ready catalogue, built in the browser.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
              For a UK food wholesaler’s internal sales portal I built the tools that turn a range of around 2,500 products into an A4 catalogue: a millimetre-exact page engine, a flyer editor whose prices and QR codes come from the database, and a PDF compressor for the result.
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
              That code and data belong to the company, so this is a clean rebuild on the same stack with a made-up wholesaler, fake products and generated photos. Everything below runs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo/catalogues/main/export" className="inline-flex items-center gap-2 rounded-full bg-[#e9b44c] px-5 py-2.5 font-semibold text-[#0d1b2e] hover:bg-[#f2c56a]">
                Try the catalogue builder <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <a href="#engine" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                How it works
              </a>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              {[
                ['Stack', 'Next.js 16 · React 19 · TypeScript'],
                ['PDF', 'CSS mm + @page, pdf-lib, sharp'],
                ['My role', 'UI, route handlers, storage'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{k}</dt>
                  <dd className="mt-0.5 text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroPages category={tree[0]} flyer={heroFlyer} />
        </div>
      </section>

      {/* ── Problem ── */}
      <Section
        eyebrow="The problem"
        title="Sales reps needed a catalogue that was never out of date."
        intro={
          <>
            A catalogue put together by hand goes stale the day a price changes. The portal already held the products, prices and photos; the job was to turn them into pages that look designed, print exactly, and stay small enough to email.
          </>
        }
      >
        <div className="grid gap-8 md:grid-cols-4">
          <Point title="Exact A4">Consistent margins and bands on every page, printed straight from the browser.</Point>
          <Point title="Thousands of photos">Some missing, some slow, some broken, and the print must not start before they arrive.</Point>
          <Point title="No code for users">Office staff change the layout, covers and flyers with switches and sliders.</Point>
          <Point title="Shareable output">The finished PDF has to be small enough to send to customers.</Point>
        </div>
      </Section>

      {/* ── Feature index ── */}
      <div className="px-5 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_NAV.map((f, i) => (
            <a key={f.href} href={f.href} className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1b2e] text-[#e9b44c]">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold text-zinc-400">0{i + 1}</span>
                <span className="block font-semibold text-zinc-900">{f.label}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ── 01 Layout engine ── */}
      <Section
        id="engine"
        eyebrow="01 · Layout engine"
        title="Pages are computed in millimetres, then drawn by React."
        intro={
          <>
            The layout is a set of pure functions with no React or DOM in them. They take the products and the settings and return page models; the preview, the printed PDF and the tests all use the same output. Switch the options below: this is the real <Code>packPages</Code> running in your browser.
          </>
        }
      >
        <PackingDiagram />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Point title="Grid sized from the paper">
            Card width and height come from 210 × 297 mm minus header, footer and edge gap. Make the header taller and the cards get shorter; nothing overflows.
          </Point>
          <Point title="Small shelves share a page">
            A category always starts on a fresh page. A small subcategory moves up under the previous one if at least one full row fits; the rest continues overleaf, marked “continued”.
          </Point>
          <Point title="Dividers paid for by height">
            A ribbon above each subcategory costs space. Cards on that page get slightly shorter (never below 85%) instead of a row being dropped.
          </Point>
          <Point title="Numbers from the final order">
            Cover, contents, flyers and category covers are added first, then every page is numbered. The contents page reads its numbers from that list and links to each page in the PDF.
          </Point>
          <Point title="Print is just CSS">
            Each page is a <Code>210mm × 297mm</Code> box with <Code>@page {'{ size: A4; margin: 0 }'}</Code> and <Code>break-after: page</Code>. Text stays text, so the PDF is searchable and the QR codes stay sharp.
          </Point>
          <Point title="Tested by properties">
            Over 300 random catalogues per option set, the tests check that every product appears exactly once and in order, no page has more rows than the grid, and categories never share a page.
          </Point>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <TryLink href="/demo/catalogues/main/export">Open the export page</TryLink>
        </div>
      </Section>

      {/* ── 02 Flyers ── */}
      <Section
        id="flyers"
        dark
        eyebrow="02 · Flyer editor"
        title="Product details on a poster, filled from the database."
        intro={<>Marketing makes the poster. In the editor, staff search for a product and drop a “focal” on it: name, pack size, prices, code and a QR code all come from the product record. Nobody types a price.</>}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[210/297] overflow-hidden rounded-md shadow-2xl ring-1 ring-white/10" style={{ containerType: 'inline-size' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/flyers/fl-pantry/art" alt="Pantry Savers flyer from the demo" className="absolute inset-0 h-full w-full object-cover" />
              {pantry.map((f, i) => (
                <FocalView key={f.id} focal={f} warning={i === 1} />
              ))}
              {sampleFocal ? (
                <>
                  <div className="pointer-events-none absolute outline-2 outline-offset-2 outline-sky-400" style={{ left: `${sampleFocal.x * 100}%`, top: `${sampleFocal.y * 100}%`, width: `${sampleFocal.w * 100}%`, height: `${sampleFocal.h * 100}%`, borderRadius: '1.2cqw' }} />
                </>
              ) : null}
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ['Resolution-independent', 'Every box is stored as x, y, width and height between 0 and 1 of the poster, so the same focals print at any size. Text is sized in container query units for the same reason.'],
              ['Snapping with guides', 'Edges and centres snap to the page and to other focals. The threshold is in screen pixels, so it feels the same at every zoom.'],
              ['Undo that behaves', 'History is one state object with a 40-step cap. A drag is one entry, not one per mouse move. Ctrl+Z, Ctrl+Shift+Z, Ctrl+D, Delete and arrow nudging all work.'],
              ['Warns before print', 'If a product on a flyer is discontinued, the flyer gets a red badge in the list and the focal is flagged in the editor and on the page.'],
              ['Search that keeps up', 'Typing is debounced and slower, older responses are ignored, so results never jump back to an earlier query.'],
              ['Save is all or nothing', 'The flyer’s focals are validated with zod and replaced in one step; the editor asks before you leave with unsaved changes.'],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="font-semibold text-white">{t}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-zinc-300">{d}</p>
              </div>
            ))}
            <div className="sm:col-span-2">
              <Link href="/demo/catalogues/main/flyers/fl-grill" className="inline-flex items-center gap-2 rounded-full bg-[#e9b44c] px-4 py-2 text-sm font-semibold text-[#0d1b2e] hover:bg-[#f2c56a]">
                Open the flyer editor <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 03 Photos ── */}
      <Section
        id="photos"
        eyebrow="03 · Photo loader"
        title="Hundreds of photos, six at a time, with a report before printing."
        intro={<>If every image starts at once, the photo host gets flooded and the print dialog opens over half-empty cards. Photos go through one shared queue instead.</>}
      >
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <svg viewBox="0 0 520 250" className="w-full" role="img" aria-label="Photo requests flow from a queue through six slots and end as loaded, missing or failed">
              <defs>
                <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill="#a1a1aa" />
                </marker>
              </defs>
              <text x="10" y="22" fontSize="12" fontWeight="600" fill="#18181b">Queue</text>
              {Array.from({ length: 7 }, (_, i) => (
                <rect key={i} x={10 + i * 18} y={34} width="14" height="40" rx="3" fill={i === 0 ? '#0d1b2e' : '#d4d4d8'} />
              ))}
              <text x="10" y="92" fontSize="10" fill="#71717a">on-screen page jumps the line</text>
              <path d="M150 54 H200" stroke="#a1a1aa" strokeWidth="1.5" markerEnd="url(#arr)" />
              <text x="210" y="22" fontSize="12" fontWeight="600" fill="#18181b">6 in flight</text>
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <rect x="210" y={32 + i * 22} width="120" height="16" rx="8" fill="#f4f4f5" />
                  <rect x="210" y={32 + i * 22} width={[100, 64, 112, 40, 86, 20][i]} height="16" rx="8" fill="#7fa7b5" />
                </g>
              ))}
              <text x="210" y="178" fontSize="10" fill="#71717a">errors retried with back-off (3 tries)</text>
              <path d="M340 100 H380" stroke="#a1a1aa" strokeWidth="1.5" markerEnd="url(#arr)" />
              {[
                ['Loaded', '#10b981', 30],
                ['Missing · 404', '#a1a1aa', 82],
                ['Failed · retry?', '#e11d48', 134],
              ].map(([l, c, y]) => (
                <g key={l as string}>
                  <rect x="390" y={y as number} width="120" height="34" rx="8" fill="#fff" stroke={c as string} strokeWidth="1.5" />
                  <text x="450" y={(y as number) + 21} fontSize="11" fontWeight="600" textAnchor="middle" fill={c as string}>
                    {l}
                  </text>
                </g>
              ))}
              <text x="390" y="200" fontSize="10" fill="#71717a">“Missing” = no photo yet,</text>
              <text x="390" y="214" fontSize="10" fill="#71717a">fix the data. “Failed” = the</text>
              <text x="390" y="228" fontSize="10" fill="#71717a">host errored, retry it.</text>
            </svg>
          </div>
          <div className="space-y-6">
            <Point title="One queue for the whole app">
              A small class keeps state per URL (queued, loading, loaded, missing, failed) and React components subscribe with <Code>useSyncExternalStore</Code>, so a card re-renders only when its own photo changes.
            </Point>
            <Point title="Save as PDF waits">
              The button renders every page, waits until no photo is queued or loading, then shows what is missing or failed with a retry before it opens the print dialog.
            </Point>
            <Point title="Memoised cards">
              Moving a slider re-renders pages but not hundreds of unchanged cards; the cards are memoised on their product and card settings.
            </Point>
            <p className="text-sm text-zinc-500">The demo’s fake photo host answers slowly on purpose, has products with no photo and one that always errors, so you can see all three outcomes.</p>
          </div>
        </div>
      </Section>

      {/* ── 04 Compression ── */}
      <Section
        id="compress"
        dark
        eyebrow="04 · PDF compression"
        title="Shrink the PDF by resampling only what is too big."
        intro={<>A browser-printed catalogue embeds every photo at full resolution even when it is printed 5 cm wide. The compressor reads the PDF’s drawing instructions to find each photo’s real printed size and resamples it to that, leaving text and vectors alone.</>}
      >
        <ol className="grid gap-3 md:grid-cols-5">
          {[
            ['Upload', 'Streamed to a temp file with a running size check. Must start with %PDF-.', '15%'],
            ['Analyse', 'A spread-out sample of up to 40 photos is encoded at each quality level to predict the output size.', '7%'],
            ['Resample', 'Each photo is resized to drawn size ÷ 72 × ppi (down only) and re-encoded, 2 to 8 at a time.', '63%'],
            ['Save', 'Only images that shrank by at least 8% are replaced. Soft masks are resized with them.', '10%'],
            ['Download', 'One overall percentage, polled every 700 ms. If still over target, one level lower is tried.', '5%'],
          ].map(([t, d, w], i) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="flex items-center justify-between text-xs text-zinc-400">
                <span>Step {i + 1}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono">{w}</span>
              </p>
              <p className="mt-2 font-semibold text-white">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-zinc-500">The percentages are each phase’s share of the progress bar.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e9b44c]/40 bg-[#e9b44c]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#e9b44c]">In production (reported)</p>
            <p className="mt-2 text-3xl font-semibold text-white">≈ 300 MB → ≈ 30 MB</p>
            <p className="mt-2 text-sm text-zinc-300">A typical full catalogue print, compressed in the live system this rebuild is based on. Reported from that system, not reproduced here.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">In this demo (measured)</p>
            <p className="mt-2 text-3xl font-semibold text-white">{CASE_STUDY_FACTS.sampleBefore} → {CASE_STUDY_FACTS.sampleAfter}</p>
            <p className="mt-2 text-sm text-zinc-300">The bundled 8-page sample with 72 photos, deliberately saved far above print resolution. Run it yourself; the page shows the numbers for each run.</p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/demo/compress" className="inline-flex items-center gap-2 rounded-full bg-[#e9b44c] px-4 py-2 text-sm font-semibold text-[#0d1b2e] hover:bg-[#f2c56a]">
            Compress the sample <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* ── Architecture ── */}
      <Section id="architecture" eyebrow="Architecture" title="Thin route handlers, pure modules, one source of truth for pages.">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
          <svg viewBox="0 0 900 360" className="w-full" role="img" aria-label="Architecture: browser pages call route handlers; pure modules do layout, snapping and compression; data lives in a store and temp files">
            <defs>
              <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#71717a" />
              </marker>
            </defs>
            <rect x="10" y="20" width="270" height="320" rx="16" fill="#f4f4f5" />
            <text x="30" y="50" fontSize="14" fontWeight="700" fill="#18181b">Browser · React 19</text>
            {['Export page (sidebar, preview, print)', 'Flyer list + focal editor', 'Products + folder order (dnd-kit)', 'Compress page (XHR upload, polling)'].map((t, i) => (
              <g key={t}>
                <rect x="30" y={70 + i * 62} width="230" height="46" rx="10" fill="#fff" stroke="#d4d4d8" />
                <text x="45" y={98 + i * 62} fontSize="12" fill="#27272a">{t}</text>
              </g>
            ))}
            <rect x="320" y="20" width="250" height="150" rx="16" fill="#0d1b2e" />
            <text x="340" y="50" fontSize="14" fontWeight="700" fill="#fff">Pure modules (shared)</text>
            {['layout.ts · packPages, buildToc', 'snap.ts · snapRect, clampRect', 'photo-queue.ts · queued loader'].map((t, i) => (
              <text key={t} x="340" y={82 + i * 28} fontSize="12" fill="#cbd5e1">{t}</text>
            ))}
            <rect x="320" y="190" width="250" height="150" rx="16" fill="#fff" stroke="#d4d4d8" />
            <text x="340" y="220" fontSize="14" fontWeight="700" fill="#18181b">Route handlers · Node</text>
            {['zod-validated JSON APIs', 'streaming PDF upload + job queue', 'compress-pdf.ts · pdf-lib + sharp'].map((t, i) => (
              <text key={t} x="340" y={252 + i * 28} fontSize="12" fill="#3f3f46">{t}</text>
            ))}
            <rect x="610" y="190" width="270" height="150" rx="16" fill="#f4f4f5" />
            <text x="630" y="220" fontSize="14" fontWeight="700" fill="#18181b">Storage</text>
            <text x="630" y="252" fontSize="12" fill="#3f3f46">Demo: in-memory store, temp files</text>
            <text x="630" y="280" fontSize="12" fill="#3f3f46">Original: Postgres + S3-compatible</text>
            <text x="630" y="300" fontSize="12" fill="#3f3f46">object storage</text>
            <rect x="610" y="20" width="270" height="150" rx="16" fill="#fff" stroke="#e9b44c" strokeWidth="1.5" />
            <text x="630" y="50" fontSize="14" fontWeight="700" fill="#18181b">Output</text>
            <text x="630" y="82" fontSize="12" fill="#3f3f46">window.print() → A4 PDF</text>
            <text x="630" y="110" fontSize="12" fill="#3f3f46">(vector text, internal links)</text>
            <text x="630" y="138" fontSize="12" fill="#3f3f46">→ optional compression job</text>
            <path d="M280 130 H315" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#a2)" />
            <path d="M280 260 H315" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#a2)" />
            <path d="M570 265 H605" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#a2)" />
            <path d="M570 95 H605" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#a2)" />
          </svg>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Point title="Server components load, client components edit">
            Pages read the catalogue on the server and hand it to one client component per screen, so the first paint already has data and there is no loading spinner for the main content.
          </Point>
          <Point title="Settings that survive bad input">
            Export settings are one versioned object in localStorage, parsed with per-field fallbacks. An old or hand-edited value falls back field by field instead of breaking the page.
          </Point>
          <Point title="Optimistic, with rollback">
            Reordering and suspending flyers update the list at once; if the server refuses, the list goes back to what is stored and says so.
          </Point>
        </div>
      </Section>

      {/* ── Honest notes ── */}
      <Section eyebrow="Looking back" title="What I would keep, and what this rebuild does better.">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-zinc-900">Improved in this rebuild</p>
            <ul className="mt-3 space-y-2 text-[15px] text-zinc-600">
              <li>• Unit and property tests for the layout engine, snapping and compression helpers (the original had none).</li>
              <li>• Uploads streamed to disk with a size cut-off, and one compression job at a time, instead of buffering whole files in memory.</li>
              <li>• Focals warn when the price list changes; the original kept the price captured at placement without telling anyone.</li>
              <li>• Every list is keyboard sortable and dialogs trap focus and close on Escape.</li>
              <li>• Saving focals replaces them in one step, so a failure can’t leave half a flyer.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-zinc-900">Known limits</p>
            <ul className="mt-3 space-y-2 text-[15px] text-zinc-600">
              <li>• Printing depends on the browser; Chrome is the target and Firefox breaks some pages differently.</li>
              <li>• The contents page is a single page; a much larger range would need it to flow onto a second one.</li>
              <li>• Job state is in memory, so a restart loses running jobs. A table for jobs would fix that.</li>
              <li>• Next steps: visual regression of printed pages with Playwright, and automated accessibility checks.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="bg-[#0d1b2e] px-5 py-14 text-zinc-300 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="font-serif text-2xl font-semibold text-white">Built by {PROFILE.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Harbourline Wholesale is fictional. No code, data, branding or documents from the real company are used: products, prices, photos and posters are generated, and every file in this project was written for this rebuild.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-full bg-[#e9b44c] px-5 py-2.5 font-semibold text-[#0d1b2e] hover:bg-[#f2c56a]">
              Open the demo
            </Link>
            {PROFILE.github ? (
              <a href={PROFILE.github} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                <Icon name="github" /> Source
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
