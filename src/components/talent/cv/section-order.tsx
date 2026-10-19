"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import { reorderCvSections } from "@/server/actions/cv";

export type SectionRow = { id: string; name: string; content: ReactNode };

/**
 * « Sections · glisser pour réordonner » (planche talent-4 § 6): each row has its grip; a finger or
 * a mouse drags it, the arrow keys move it once it has the focus. The new order is saved when the
 * row is let go. Only the layout changes, never the content.
 */
export function SectionOrder({
  documentId,
  rows,
  labels,
  className = "t-verre t-liste t-edl",
}: {
  documentId: string;
  rows: SectionRow[];
  labels: { grip: string; moved: string; error: string };
  /** The list's look: a glass card on a phone, rows of the « Sections » panel in the web studio. */
  className?: string;
}) {
  const [order, setOrder] = useState(() => rows.map((row) => row.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const list = useRef<HTMLUListElement>(null);
  const byId = new Map(rows.map((row) => [row.id, row]));
  // A new order from the server (another tab, a reset) replaces the local one.
  const ids = rows.map((row) => row.id).join(",");
  const [seen, setSeen] = useState(ids);
  if (seen !== ids) {
    setSeen(ids);
    setOrder(rows.map((row) => row.id));
  }

  const save = (next: string[]) => {
    startTransition(async () => {
      const result = await reorderCvSections(documentId, next);
      if (!result.ok) {
        setOrder(rows.map((row) => row.id));
        showToast({ message: labels.error, tone: "error" });
      }
    });
  };

  const move = (id: string, to: number) => {
    const next = order.filter((item) => item !== id);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
    setOrder(next);
    return next;
  };

  /** The index the dragged row would take at the pointer's height. */
  const indexAt = (y: number, id: string) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[data-section]") ?? [])].filter(
      (item) => item.dataset.section !== id,
    );
    const index = items.findIndex((item) => {
      const box = item.getBoundingClientRect();
      return y < box.top + box.height / 2;
    });
    return index < 0 ? items.length : index;
  };

  return (
    <ul ref={list} className={className}>
      {order.map((id, index) => {
        const row = byId.get(id);
        if (!row) return null;
        return (
          <li key={id} data-section={id} className={cx("t-li", dragging === id && "t-tire")}>
            <button
              type="button"
              className="t-poig"
              aria-label={labels.grip.replace("{section}", row.name)}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(id);
              }}
              onPointerMove={(event) => {
                if (dragging !== id) return;
                const to = indexAt(event.clientY, id);
                if (order.indexOf(id) !== to) move(id, to);
              }}
              onPointerUp={() => {
                if (dragging !== id) return;
                setDragging(null);
                if (order.join(",") !== ids) save(order);
              }}
              onPointerCancel={() => setDragging(null)}
              onKeyDown={(event) => {
                const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                if (!step) return;
                event.preventDefault();
                const to = index + step;
                if (to < 0 || to >= order.length) return;
                save(move(id, to));
                showToast({ message: labels.moved.replace("{section}", row.name), tone: "info" });
                // The grip keeps the focus after the move.
                const target = event.currentTarget;
                requestAnimationFrame(() => target.focus());
              }}
            >
              <i />
              <i />
              <i />
            </button>
            {row.content}
          </li>
        );
      })}
    </ul>
  );
}
