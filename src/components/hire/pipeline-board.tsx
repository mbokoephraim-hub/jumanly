"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import { moveCardAction } from "@/server/actions/hire";

export type BoardColumn = {
  id: string;
  name: string;
  /** Colour of the dot (`stageTone`). */
  tone: string;
  /** « Recruté » and « Non retenu » start folded (mockup 04-04). */
  folded: boolean;
};

export type BoardCard = {
  id: string;
  stageId: string;
  name: string;
  movable: boolean;
  body: ReactNode;
};

/** Cards shown per column before « + N autres ». */
const SHOWN = 5;
/** A press this long on a touch screen picks the card up; a shorter swipe scrolls. */
const LONG_PRESS_MS = 320;

type Drag = {
  card: BoardCard;
  ghost: HTMLElement;
  dx: number;
  dy: number;
  over: string | null;
};

/**
 * Columns of the pipeline with drag and drop (mockup 04-04, docs/experience-animee): the card
 * follows the pointer or the finger (a long press on touch screens), the column under it lights
 * up, and the drop moves the application at once, with « Annuler » in the toast. With the
 * keyboard: Space picks the focused card up, the arrows choose the column, Space drops, Escape
 * cancels. « Non retenu » opens the decision form instead: nobody is rejected by a drop alone.
 * Each card also keeps its « … » menu with ordinary forms, which work without JavaScript.
 */
export function PipelineBoard({
  columns,
  cards: initial,
  canMove,
  mobileStage,
}: {
  columns: BoardColumn[];
  cards: BoardCard[];
  canMove: boolean;
  /** Column shown on phones (the stage tabs above choose it). */
  mobileStage: string;
}) {
  const t = useTranslations("hire.pipeline");
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [held, setHeld] = useState<{ id: string; column: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [, startTransition] = useTransition();
  const drag = useRef<Drag | null>(null);
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);

  // The server's order wins after each refresh.
  const [server, setServer] = useState(initial);
  if (server !== initial) {
    setServer(initial);
    setCards(initial);
  }

  const nameOf = useCallback(
    (stageId: string) => columns.find((column) => column.id === stageId)?.name ?? "",
    [columns],
  );

  const undoRef = useRef<((card: BoardCard, stageId: string) => void) | null>(null);
  const move = useCallback(
    (card: BoardCard, stageId: string, undo = false) => {
      if (card.stageId === stageId) return;
      const from = card.stageId;
      setCards((list) => list.map((item) => (item.id === card.id ? { ...item, stageId } : item)));
      startTransition(async () => {
        const result = await moveCardAction({ applicationId: card.id, stageId }).catch(() => ({
          status: "error" as const,
        }));
        if (result.status === "decision") {
          setCards((list) =>
            list.map((item) => (item.id === card.id ? { ...item, stageId: from } : item)),
          );
          router.push(result.href);
          return;
        }
        if (result.status === "error") {
          setCards((list) =>
            list.map((item) => (item.id === card.id ? { ...item, stageId: from } : item)),
          );
          showToast({ message: t("drag.canceled"), tone: "error" });
          return;
        }
        if (result.status === "moved" && !undo)
          showToast({
            message: t("moved.text", { candidateName: card.name, stage: result.stage }),
            detail: t("moved.notified"),
            action: {
              label: t("moved.undo"),
              run: () => undoRef.current?.({ ...card, stageId }, from),
            },
          });
        router.refresh();
      });
    },
    [router, t],
  );
  useEffect(() => {
    undoRef.current = (card, stageId) => move(card, stageId, true);
  }, [move]);

  // ─── Pointer ────────────────────────────────────────────────────────────────

  const targetAt = (x: number, y: number) => {
    const node = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop-stage]");
    return node?.dataset.dropStage ?? null;
  };
  const light = (stageId: string | null) => {
    for (const node of document.querySelectorAll<HTMLElement>("[data-drop-stage]"))
      node.toggleAttribute("data-drop-over", node.dataset.dropStage === stageId);
    setOver(stageId);
  };

  const start = (card: BoardCard, source: HTMLElement, x: number, y: number) => {
    const box = source.getBoundingClientRect();
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    ghost.querySelectorAll("[popover], details").forEach((node) => node.remove());
    ghost.removeAttribute("id");
    ghost.setAttribute("aria-hidden", "true");
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      margin: "0",
      zIndex: "70",
      pointerEvents: "none",
    });
    ghost.classList.add("jm-drag-ghost");
    document.body.appendChild(ghost);
    drag.current = { card, ghost, dx: x - box.left, dy: y - box.top, over: card.stageId };
    setDragging(card.id);
    light(card.stageId);
    navigator.vibrate?.(8);
  };

  const follow = (x: number, y: number) => {
    const current = drag.current;
    if (!current) return;
    current.ghost.style.left = `${x - current.dx}px`;
    current.ghost.style.top = `${y - current.dy}px`;
    const stage = targetAt(x, y);
    if (stage !== current.over) {
      current.over = stage;
      light(stage);
    }
    // Near the edges, the board scrolls on its own.
    const board = document.getElementById("pipeline-board");
    if (board) {
      const edge = board.getBoundingClientRect();
      if (x > edge.right - 60) board.scrollLeft += 14;
      else if (x < edge.left + 60) board.scrollLeft -= 14;
    }
  };

  const finish = (drop: boolean) => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    current.ghost.remove();
    light(null);
    setDragging(null);
    if (drop && current.over && current.over !== current.card.stageId) {
      setAnnounce(
        t("drag.dropped", { candidateName: current.card.name, stage: nameOf(current.over) }),
      );
      move(current.card, current.over);
    }
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (press.current && !drag.current) {
        // A touch that moves before the long press is a scroll.
        if (Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 8) {
          window.clearTimeout(press.current.timer);
          press.current = null;
        }
        return;
      }
      follow(event.clientX, event.clientY);
    };
    const onUp = () => {
      if (press.current) window.clearTimeout(press.current.timer);
      press.current = null;
      finish(true);
    };
    const onCancel = () => {
      if (press.current) window.clearTimeout(press.current.timer);
      press.current = null;
      finish(false);
    };
    // While a card is held, the page does not scroll under the finger.
    const onTouchMove = (event: TouchEvent) => {
      if (drag.current) event.preventDefault();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  });

  const onPointerDown = (card: BoardCard) => (event: ReactPointerEvent<HTMLLIElement>) => {
    if (!canMove || !card.movable || event.button !== 0) return;
    // Links, buttons and menus inside the card keep their own behaviour.
    if ((event.target as HTMLElement).closest("a, button, summary, input, select, [popover]"))
      return;
    const source = event.currentTarget;
    const { clientX: x, clientY: y } = event;
    if (event.pointerType === "mouse") {
      event.preventDefault();
      let started = false;
      const begin = (moveEvent: PointerEvent) => {
        if (started) return;
        if (Math.hypot(moveEvent.clientX - x, moveEvent.clientY - y) < 5) return;
        started = true;
        window.removeEventListener("pointermove", begin);
        start(card, source, x, y);
        follow(moveEvent.clientX, moveEvent.clientY);
      };
      window.addEventListener("pointermove", begin);
      window.addEventListener("pointerup", () => window.removeEventListener("pointermove", begin), {
        once: true,
      });
      return;
    }
    press.current = {
      x,
      y,
      timer: window.setTimeout(() => {
        press.current = null;
        start(card, source, x, y);
      }, LONG_PRESS_MS),
    };
  };

  // ─── Keyboard ───────────────────────────────────────────────────────────────

  const onKeyDown = (card: BoardCard) => (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget || !canMove || !card.movable) return;
    const index = columns.findIndex((column) => column.id === card.stageId);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!held) {
        setHeld({ id: card.id, column: index });
        light(card.stageId);
        setAnnounce(t("drag.grabbed", { candidateName: card.name, stage: nameOf(card.stageId) }));
        return;
      }
      const target = columns[held.column]!;
      setHeld(null);
      light(null);
      setAnnounce(t("drag.dropped", { candidateName: card.name, stage: target.name }));
      move(card, target.id);
      return;
    }
    if (!held) return;
    if (event.key === "Escape") {
      setHeld(null);
      light(null);
      setAnnounce(t("drag.canceled"));
      return;
    }
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const column = Math.min(columns.length - 1, Math.max(0, held.column + step));
    setHeld({ ...held, column });
    light(columns[column]!.id);
    setAnnounce(t("stage.dropHere", { stage: columns[column]!.name }));
  };

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <>
      <p className="sr-only" aria-live="assertive">
        {announce}
      </p>
      <div
        id="pipeline-board"
        className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:snap-none lg:px-0"
      >
        {columns.map((column) => {
          const list = cards.filter((card) => card.stageId === column.id);
          const folded = column.folded && !open.has(column.id) && over !== column.id;
          const shown = expanded.has(column.id) ? list : list.slice(0, SHOWN);
          const lit = over === column.id && (dragging !== null || held !== null);
          return (
            <section
              key={column.id}
              aria-labelledby={`col-${column.id}`}
              data-drop-stage={column.id}
              className={cx(
                "flex shrink-0 flex-col gap-2.5 rounded-[22px] p-3 transition-[background-color,box-shadow,width] duration-200",
                lit ? "bg-lime-clair ring-2 ring-lime ring-inset" : "bg-blanc/55",
                folded
                  ? "w-14 items-center"
                  : "w-[86vw] snap-start sm:w-[260px] lg:w-auto lg:min-w-[218px] lg:flex-1",
                column.id !== mobileStage && "max-lg:hidden",
              )}
            >
              {folded ? (
                <button
                  type="button"
                  onClick={() => setOpen(toggle(open, column.id))}
                  aria-expanded={false}
                  className="flex flex-col items-center gap-3 py-1"
                >
                  <span aria-hidden className={cx("size-2.5 rounded-full", column.tone)} />
                  <span className="rounded-pill bg-blanc px-2 py-0.5 text-[11px] font-semibold">
                    {list.length}
                  </span>
                  <span
                    id={`col-${column.id}`}
                    className="rotate-180 text-[13px] font-semibold [writing-mode:vertical-rl]"
                  >
                    {column.name}
                  </span>
                </button>
              ) : (
                <>
                  <h2
                    id={`col-${column.id}`}
                    className="flex items-center gap-2 px-1 text-[14px] leading-5 font-semibold"
                  >
                    <span
                      aria-hidden
                      className={cx("size-2.5 shrink-0 rounded-full", column.tone)}
                    />
                    <span className="min-w-0 truncate">{column.name}</span>
                    <span className="rounded-pill bg-blanc px-2 py-0.5 text-[11px] font-semibold">
                      {t("stage.count", { count: list.length })}
                    </span>
                    {column.folded && (
                      <button
                        type="button"
                        onClick={() => setOpen(toggle(open, column.id))}
                        aria-label={t("stage.collapse")}
                        className="ml-auto grid size-7 place-items-center rounded-full hover:bg-blanc"
                      >
                        <Icon name="chev-l" className="size-4" />
                      </button>
                    )}
                  </h2>
                  {lit && (
                    <p className="rounded-[14px] border border-dashed border-feuille px-3 py-2 text-[11.5px] text-sapin">
                      {t("stage.dropHere", { stage: column.name })}
                    </p>
                  )}
                  {list.length === 0 && !lit && (
                    <p className="px-1 py-3 text-[12px] text-ardoise">{t("stage.empty")}</p>
                  )}
                  <ul className="flex flex-col gap-2.5">
                    {shown.map((card) => (
                      <li
                        key={card.id}
                        tabIndex={canMove && card.movable ? 0 : undefined}
                        aria-roledescription={canMove && card.movable ? t("drag.aria") : undefined}
                        aria-label={card.name}
                        onPointerDown={onPointerDown(card)}
                        onKeyDown={onKeyDown(card)}
                        className={cx(
                          "jm-card-in relative rounded-[18px] bg-blanc p-3.5 transition-[opacity,box-shadow,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sapin",
                          canMove &&
                            card.movable &&
                            "cursor-grab select-none active:cursor-grabbing",
                          dragging === card.id && "opacity-35",
                          held?.id === card.id && "-rotate-1 shadow-float ring-2 ring-sapin",
                        )}
                      >
                        {card.body}
                      </li>
                    ))}
                  </ul>
                  {list.length > SHOWN && (
                    <button
                      type="button"
                      onClick={() => setExpanded(toggle(expanded, column.id))}
                      className="self-center rounded-pill px-3 py-1.5 text-[12px] font-medium text-ardoise hover:bg-blanc hover:text-sapin"
                    >
                      {expanded.has(column.id)
                        ? t("stage.collapse")
                        : t("card.more", { count: list.length - SHOWN })}
                    </button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
