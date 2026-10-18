'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Accessible dialog: focus moves in, Tab is trapped, Escape closes, focus returns on close. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
        (el) => !el.hasAttribute('disabled')
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const els = focusables();
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 print:hidden" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
          <h2 id="modal-title" className="text-base font-semibold text-zinc-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
