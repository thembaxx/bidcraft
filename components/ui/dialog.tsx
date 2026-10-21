'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function Dialog({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close(); document.body.style.overflow = previous;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={labelledBy} onCancel={(event) => { event.preventDefault(); onClose(); }}
    className={`brand-dialog m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 text-[#0D0F0E] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:border-neutral-800 dark:bg-[#161918] dark:text-white ${className}`}>
    {children}
  </dialog>;
}
