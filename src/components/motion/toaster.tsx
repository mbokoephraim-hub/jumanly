"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

export type ToastInput = {
  message: string;
  tone?: "success" | "error" | "info";
  /** Where the toast leads when clicked. */
  href?: string;
  /** A short action inside the toast (« Annuler » after a move). */
  action?: { label: string; run: () => void };
  /** Second line, smaller (« Le candidat a été informé… »). */
  detail?: string;
};
type Shown = ToastInput & { id: number };

const EVENT = "jm:toast";
/** How long a toast stays, unless the pointer rests on it. */
const DURATION_MS = 6000;

/** Shows a toast from anywhere in the signed-in space. */
export function showToast(toast: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: toast }));
}

const icons: Record<NonNullable<ToastInput["tone"]>, IconName> = {
  success: "check",
  error: "fermer",
  info: "info",
};

/**
 * Toasts of the signed-in space (docs/experience-animee § 4.2): from the top right on computers,
 * from the top on phones, with a thin time bar that empties and stops while the pointer rests on
 * the toast. The live region is in the page from the start, so screen readers announce them.
 */
export function Toaster({
  label,
  closeLabel,
  placement = "top",
}: {
  label: string;
  closeLabel: string;
  /** Talent space: above the bottom bar, so a toast never covers the header (bell, account). */
  placement?: "top" | "bottom";
}) {
  const [toasts, setToasts] = useState<Shown[]>([]);
  const next = useRef(0);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastInput>).detail;
      setToasts((list) => [...list.slice(-2), { ...detail, id: ++next.current }]);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  const close = (id: number) => setToasts((list) => list.filter((toast) => toast.id !== id));

  return (
    <div
      role="region"
      aria-label={label}
      aria-live="polite"
      className={
        placement === "bottom"
          ? "pointer-events-none fixed inset-x-4 bottom-[calc(116px+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-[528px] flex-col-reverse items-center gap-2"
          : "pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:right-6 lg:items-end"
      }
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          closeLabel={closeLabel}
          onDone={() => close(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  closeLabel,
  onDone,
}: {
  toast: Shown;
  closeLabel: string;
  onDone: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const left = useRef(DURATION_MS);
  const started = useRef(0);

  useEffect(() => {
    if (paused) return;
    started.current = Date.now();
    const timer = window.setTimeout(onDone, left.current);
    return () => {
      window.clearTimeout(timer);
      left.current -= Date.now() - started.current;
    };
  }, [paused, onDone]);

  const tone = toast.tone ?? "success";
  const body = (
    <>
      <span
        aria-hidden
        className={cx(
          "jm-toast-icon flex size-[26px] shrink-0 items-center justify-center rounded-full",
          tone === "error" ? "bg-corail text-blanc" : "bg-lime text-sapin",
        )}
      >
        <Icon name={icons[tone]} className="size-3.5" />
      </span>
      <span className="flex flex-1 flex-col py-1.5 text-sm leading-5">
        {toast.message}
        {toast.detail && (
          <span className="text-[11.5px] leading-4 text-blanc/70">{toast.detail}</span>
        )}
      </span>
    </>
  );
  return (
    <div
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      data-paused={paused ? "" : undefined}
      className="jm-toast pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-[16px] bg-sapin py-2 pr-2 pl-[18px] text-blanc shadow-float"
    >
      {toast.href ? (
        <Link href={toast.href} onClick={onDone} className="flex flex-1 items-center gap-3">
          {body}
        </Link>
      ) : (
        <span className="flex flex-1 items-center gap-3">{body}</span>
      )}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.run();
            onDone();
          }}
          className="shrink-0 rounded-pill px-3 py-2 text-sm font-semibold text-lime hover:bg-blanc/10"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDone}
        aria-label={closeLabel}
        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blanc/10"
      >
        <Icon name="fermer" className="size-5" />
      </button>
      <span
        aria-hidden
        className="jm-toast-time absolute inset-x-0 bottom-0 h-0.5 origin-left bg-lime"
        style={{ animationDuration: `${DURATION_MS}ms` }}
      />
    </div>
  );
}
