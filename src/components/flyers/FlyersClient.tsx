'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FlyerRow } from '@/lib/data/flyer-queries';
import { Icon } from '@/components/ui/Icon';
import { FocalView } from './FocalView';

function FlyerCard({ row, catalogueId, onToggle }: { row: FlyerRow; catalogueId: string; onToggle: (enabled: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${isDragging ? 'z-10 shadow-xl' : ''} ${row.enabled ? 'border-zinc-200' : 'border-dashed border-zinc-300'}`}
    >
      <div className="relative aspect-[210/297] bg-zinc-100">
        <div className={`absolute inset-0 transition ${row.enabled ? '' : 'opacity-40 grayscale'}`} style={{ containerType: 'inline-size' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/flyers/${row.id}/art`} alt="" className="h-full w-full object-cover" />
          {row.focals.map((f) => (
            <FocalView key={f.id} focal={f} />
          ))}
        </div>
        <button type="button" {...attributes} {...listeners} aria-label={`Move ${row.title}`} className="absolute left-2 top-2 cursor-grab rounded-md bg-white/90 p-1.5 text-zinc-700 shadow focus-visible:outline-2 focus-visible:outline-zinc-900">
          <Icon name="grip" />
        </button>
        {!row.enabled ? <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-zinc-900/80 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-white">Suspended</span> : null}
        {row.warnings.length > 0 ? (
          <span className="group/warn absolute right-2 top-2">
            <span tabIndex={0} className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[11px] font-bold text-white shadow focus:outline-2 focus:outline-rose-900">
              <Icon name="warning" className="h-3.5 w-3.5" /> {row.warnings.length}
            </span>
            <span role="tooltip" className="pointer-events-none absolute right-0 top-8 z-20 hidden w-60 rounded-lg bg-zinc-900 p-2.5 text-xs text-white shadow-xl group-hover/warn:block group-focus-within/warn:block">
              {row.warnings.map((w) => (
                <span key={w.sku} className="block">
                  <b>{w.sku}</b> {w.title} is {w.reason === 'discontinued' ? 'discontinued' : w.reason === 'coming-soon' ? 'not in stock yet' : 'no longer in the range'}.
                </span>
              ))}
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="font-semibold text-zinc-900">{row.title}</p>
          <p className="text-xs text-zinc-500">
            {row.focalCount} focal{row.focalCount === 1 ? '' : 's'}
            {row.notes ? ` · ${row.notes}` : ''}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Link href={`/demo/catalogues/${catalogueId}/flyers/${row.id}`} className="flex-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-center text-sm font-semibold text-white hover:bg-zinc-800">
            Edit focals
          </Link>
          <button type="button" onClick={() => onToggle(!row.enabled)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            {row.enabled ? 'Suspend' : 'Resume'}
          </button>
        </div>
      </div>
    </li>
  );
}

export function FlyersClient({ catalogueId, initial }: { catalogueId: string; initial: FlyerRow[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const patch = async (body: unknown, optimistic: FlyerRow[]) => {
    const before = rows;
    setRows(optimistic);
    setError(null);
    try {
      const res = await fetch(`/api/catalogues/${catalogueId}/flyers`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setRows((await res.json()).flyers);
    } catch {
      setRows(before); // roll back the optimistic change
      setError('That change could not be saved. The list shows what is stored.');
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(rows, rows.findIndex((r) => r.id === e.active.id), rows.findIndex((r) => r.id === e.over!.id));
    void patch({ order: next.map((r) => r.id) }, next);
  };

  const active = rows.filter((r) => r.enabled).length;
  const warned = rows.filter((r) => r.warnings.length > 0).length;

  return (
    <main className="mx-auto max-w-[1600px] p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Flyers</h1>
          <p className="text-sm text-zinc-500">
            {rows.length} flyers · {active} printed after the contents page · drag to change their order
          </p>
        </div>
        {warned > 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <Icon name="warning" /> {warned} flyer{warned === 1 ? ' shows' : 's show'} a product that can no longer be sold
          </p>
        ) : null}
      </div>
      {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p> : null}
      <DndContext id="flyers" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={rectSortingStrategy}>
          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {rows.map((r) => (
              <FlyerCard key={r.id} row={r} catalogueId={catalogueId} onToggle={(enabled) => patch({ id: r.id, enabled }, rows.map((x) => (x.id === r.id ? { ...x, enabled } : x)))} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </main>
  );
}
