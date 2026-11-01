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
  /** Second line: no longer shown, toasts stay one short line. */
  detail?: string;
};
type Shown = ToastInput & { id: number };

const EVENT = "jm:toast";
/** How long a toast stays: short and discreet, a bit longer for an error or an « Annuler ». */
const DURATION_MS = 2500;
const LONG_MS = 4500;

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
  const tone = toast.tone ?? "success";
  const left = useRef(tone === "error" || toast.action ? LONG_MS : DURATION_MS);
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

  const body = (
    <>
      <span
        aria-hidden
        className={cx(
          "jm-toast-icon flex size-4 shrink-0 items-center justify-center rounded-full",
          tone === "error" ? "bg-corail text-blanc" : "bg-lime text-sapin",
        )}
      >
        <Icon name={icons[tone]} className="size-2.5" />
      </span>
      <span className="line-clamp-2 min-w-0 text-[13px] leading-[18px]">{toast.message}</span>
    </>
  );
  /* A small discreet pill (docs/modele-b): one short line, no close cross, no time bar; a tap
     closes it (or follows its link). */
  return (
    <div
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="jm-toast pointer-events-auto flex max-w-[min(100%,340px)] items-center gap-2 rounded-full bg-sapin py-1 pr-3 pl-2 text-blanc shadow-float"
    >
      {toast.href ? (
        <Link
          href={toast.href}
          onClick={onDone}
          className="flex min-h-6 min-w-0 items-center gap-2"
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onDone}
          title={closeLabel}
          className="flex min-h-6 min-w-0 items-center gap-2 text-left"
        >
          {body}
        </button>
      )}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.run();
            onDone();
          }}
          className="min-h-6 shrink-0 rounded-pill px-2 py-0.5 text-[13px] font-semibold text-lime hover:bg-blanc/10"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
