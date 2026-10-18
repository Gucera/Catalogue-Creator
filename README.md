# Harbourline Catalogue Studio

A working re-implementation of an internal tool I built for a food wholesaler: it turns a product database into a print-ready A4 catalogue in the browser, lets non-designers place live product details on promotional flyers, and shrinks the finished PDF so it can be emailed.

The original runs on private company data and infrastructure, so it can't be shown. This repository rebuilds the same ideas with the same stack on a fictional wholesaler, **Harbourline Wholesale**. Every product, price, photo, flyer and name in here is generated. No code, data or assets were copied from the original.

## Case study page

A standalone write-up with screenshots lives in [`case-study/index.html`](case-study/index.html). It is plain HTML with no build step, so GitHub Pages can serve it (Settings → Pages → Branch: `main`, folder `/ (root)`); it then opens at `https://<user>.github.io/<repo>/case-study/`.

## What to look at

| Screen | What it shows |
| --- | --- |
| `/` | The case study: the problem, the decisions and what I would change |
| `/demo/catalogues/main` | Drag-and-drop ordering of categories and shelves, saved through a validated API |
| `/demo/catalogues/main/export` | The catalogue builder: covers, contents, page packing, bands, one-page preview, *Save as PDF* (61 A4 pages) |
| `/demo/catalogues/main/flyers` | Flyer list with suspend/resume and warnings when a promoted product is discontinued |
| `/demo/catalogues/main/flyers/fl-grill` | Focal editor: drag, resize, snapping guides, undo/redo, keyboard shortcuts, live price refresh |
| `/demo/compress` | PDF compression with upload progress, background job and a before/after result |

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Node 20 or newer. No accounts, keys or databases: data is seeded in memory on start and resets on restart.

## How it is built

- **Next.js (App Router) + React + TypeScript + Tailwind CSS.** Server components read the in-memory store; client components handle the interactive screens.
- **Layout engine** (`src/lib/catalogue/layout.ts`): pure functions that work in millimetres. They choose the grid, size the cards, and pack small shelves onto shared pages. Printing is plain CSS (`@page { size: A4 }`), so the browser does the PDF.
- **Photo loader** (`src/lib/photo-queue.ts`): a queue with limited concurrency and retries. Before printing, the export waits for it and reports *missing* photos separately from ones that *failed to load*, so the user can retry or print anyway.
- **Flyer focals** (`src/components/flyers`): positions are stored as fractions of the flyer, so they look the same at any size. Product text comes from the product record, not typed by hand.
- **PDF compression** (`src/lib/compress`): `pdf-lib` walks each page's drawing commands to find how large every image is actually printed, then `sharp` resamples it to a target resolution. Images are only replaced when that makes them meaningfully smaller. Uploads stream to disk and run as a queued job that the page polls for progress.
- **Validation:** every API body is parsed with `zod`; saved export settings are parsed field by field so one bad value falls back to its default instead of breaking the page.

## Tests

```bash
npm test          # vitest: layout engine (property tests over random catalogues) and snapping
npm run typecheck
npm run lint
```

CI runs all of the above plus a production build.

## Limits

This is a demo. The store is in memory, there is no authentication, and the flyer editor is built for a desktop screen. The production figures on the case-study page are labelled as reported by the team; the demo figures are measured on the sample PDF in this repo.
