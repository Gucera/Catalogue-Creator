'use client';

import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

export function SidebarSection({
  icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: IconName;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-zinc-200">
      <button type="button" onClick={onToggle} aria-expanded={open} className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
            open ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
          }`}
        >
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900">{title}</span>
          {summary ? <span className="block truncate text-[11px] text-zinc-500">{summary}</span> : null}
        </span>
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="space-y-3 px-4 pb-4 pt-1">{children}</div> : null}
    </section>
  );
}

export function SidebarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

/** Switch row; the real checkbox stays in the DOM for keyboard and screen readers. */
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  nested,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  nested?: boolean;
  hint?: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-lg py-1.5 pr-1 text-sm ${nested ? 'ml-3 border-l-2 border-zinc-200 pl-3' : 'pl-1'} ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-zinc-50'
      }`}
    >
      <span className="min-w-0 flex-1 leading-snug text-zinc-800">
        {label}
        {hint ? <span className="block text-[11px] text-zinc-500">{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-zinc-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-zinc-900 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-500 peer-focus-visible:ring-offset-1"
      />
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm text-zinc-800">
        {label}
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-zinc-900" />
    </label>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-snug text-zinc-500">{children}</p>;
}

export const selectClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10';
