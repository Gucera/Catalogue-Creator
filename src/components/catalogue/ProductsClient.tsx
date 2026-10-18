'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category, Product } from '@/lib/data/seed';
import { formatPrice } from '@/lib/data/flyers';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Icon } from '@/components/ui/Icon';
import { QueuedPhoto } from './QueuedPhoto';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';

function SortableRow({ id, children }: { id: string; children: (handle: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'relative z-10 opacity-80 shadow-lg' : ''}>
      {children({ ...attributes, ...listeners })}
    </li>
  );
}

const STATUS_BADGE: Record<Product['status'], string | null> = {
  active: null,
  'coming-soon': 'bg-amber-100 text-amber-800',
  discontinued: 'bg-zinc-200 text-zinc-600',
};

export function ProductsClient({ catalogueId, initial }: { catalogueId: string; initial: Category[] }) {
  const [cats, setCats] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [selected, setSelected] = useState<number>(initial[0]?.subcategories[0]?.id ?? 0);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(cats.map((c) => [c.id, c.subcategories.map((s) => s.id)])) !== JSON.stringify(saved.map((c) => [c.id, c.subcategories.map((s) => s.id)])),
    [cats, saved]
  );
  useUnsavedChanges(dirty);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onCategoryDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setCats((cs) => {
      const from = cs.findIndex((c) => `c${c.id}` === e.active.id);
      const to = cs.findIndex((c) => `c${c.id}` === e.over!.id);
      return arrayMove(cs, from, to);
    });
  };

  const onSubDrag = (catId: number) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setCats((cs) =>
      cs.map((c) => {
        if (c.id !== catId) return c;
        const from = c.subcategories.findIndex((s) => `s${s.id}` === e.active.id);
        const to = c.subcategories.findIndex((s) => `s${s.id}` === e.over!.id);
        return { ...c, subcategories: arrayMove(c.subcategories, from, to) };
      })
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const requests = [
        fetch(`/api/catalogues/${catalogueId}/order`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds: cats.map((c) => c.id) }),
        }),
        ...cats.map((c) =>
          fetch(`/api/catalogues/${catalogueId}/order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId: c.id, subcategoryIds: c.subcategories.map((s) => s.id) }),
          })
        ),
      ];
      const results = await Promise.all(requests);
      if (results.some((r) => !r.ok)) throw new Error('save failed');
      setSaved(cats);
      setToast({ tone: 'ok', text: 'Folder order saved. The PDF export uses it straight away.' });
    } catch {
      setToast({ tone: 'error', text: 'Could not save the order. Nothing was changed; try again.' });
    } finally {
      setSaving(false);
    }
  };

  const shelf = cats.flatMap((c) => c.subcategories.map((s) => ({ cat: c, sub: s }))).find((x) => x.sub.id === selected);
  const q = query.trim().toLowerCase();
  const products = q
    ? cats.flatMap((c) => c.subcategories.flatMap((s) => s.products)).filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    : shelf?.sub.products ?? [];
  const total = cats.reduce((n, c) => n + c.subcategories.reduce((m, s) => m + s.products.length, 0), 0);

  return (
    <div className="mx-auto flex max-w-[1600px] gap-0 print:hidden">
      <aside className="sticky top-14 flex h-[calc(100vh-7.6rem)] w-80 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">Folders</p>
          <p className="text-xs text-zinc-500">Drag, or focus a handle and use Space + arrow keys, to change the catalogue order.</p>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto p-2">
          <DndContext id="folders" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDrag}>
            <SortableContext items={cats.map((c) => `c${c.id}`)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {cats.map((c) => (
                  <SortableRow key={c.id} id={`c${c.id}`}>
                    {(handle) => (
                      <div className="rounded-lg border border-zinc-200 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <button type="button" {...handle} aria-label={`Move ${c.label}`} className="cursor-grab rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900">
                            <Icon name="grip" />
                          </button>
                          <CategoryIcon name={c.icon} className="h-4 w-4 text-zinc-500" />
                          <span className="flex-1 truncate text-sm font-semibold text-zinc-900">{c.label}</span>
                          <span className="text-[11px] tabular-nums text-zinc-400">{c.subcategories.reduce((n, s) => n + s.products.length, 0)}</span>
                        </div>
                        <DndContext id={`shelves-${c.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSubDrag(c.id)}>
                          <SortableContext items={c.subcategories.map((s) => `s${s.id}`)} strategy={verticalListSortingStrategy}>
                            <ul className="pb-1.5 pl-7 pr-1.5">
                              {c.subcategories.map((s) => (
                                <SortableRow key={s.id} id={`s${s.id}`}>
                                  {(h) => (
                                    <div className={`flex items-center gap-1 rounded-md ${selected === s.id && !q ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                                      <button type="button" {...h} aria-label={`Move ${s.label}`} className={`cursor-grab rounded p-1 ${selected === s.id && !q ? 'text-white/60' : 'text-zinc-300 hover:text-zinc-600'}`}>
                                        <Icon name="grip" className="h-3.5 w-3.5" />
                                      </button>
                                      <button type="button" onClick={() => { setSelected(s.id); setQuery(''); }} className="flex flex-1 items-center justify-between py-1 pr-2 text-left text-[13px]">
                                        <span className="truncate">{s.label}</span>
                                        <span className="text-[11px] tabular-nums opacity-60">{s.products.length}</span>
                                      </button>
                                    </div>
                                  )}
                                </SortableRow>
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </SortableRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <div className="border-t border-zinc-200 p-3">
          <button type="button" onClick={save} disabled={!dirty || saving} className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white disabled:bg-zinc-300">
            {saving ? 'Saving…' : dirty ? 'Save folder order' : 'Order saved'}
          </button>
          {dirty ? <p className="mt-1.5 text-center text-[11px] text-amber-700">Unsaved changes: leaving the page will ask first.</p> : null}
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">{q ? 'Search' : shelf?.cat.label}</p>
            <h1 className="text-xl font-semibold text-zinc-900">{q ? `“${query}”` : shelf?.sub.label}</h1>
            <p className="text-sm text-zinc-500">
              {products.length} products{q ? '' : ` · ${total} in this catalogue`}
            </p>
          </div>
          <label className="relative w-72">
            <span className="sr-only">Search products</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or code" className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-zinc-900 focus:outline-none" />
          </label>
        </div>
        {products.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">No products match “{query}”.</div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {products.map((p) => (
              <li key={p.sku} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-zinc-50">
                  <QueuedPhoto sku={p.sku} alt={p.title} urgent className="h-full w-full object-contain" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">{p.title}</p>
                <p className="text-xs text-zinc-500">
                  {p.sku} · {p.size}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-zinc-900">{formatPrice(p.eachPrice)}</span>
                  {STATUS_BADGE[p.status] ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[p.status]}`}>{p.status === 'coming-soon' ? 'Coming soon' : 'Discontinued'}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {toast ? (
        <div role="status" className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-xl ${toast.tone === 'ok' ? 'bg-zinc-900' : 'bg-rose-600'}`}>
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
