"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { reorderCandidatesAction } from "@/server/actions/hire-offer-candidates";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";

/** How long a finger stays on a card before it can be moved (ms), and how far it may slip. */
const HOLD = 380;
const SLIP = 8;

export type RhOrderRow = {
  id: string;
  name: string;
  initials: string;
  image: string | null;
  tone: number;
  headline: string;
  /** « Ville · a candidaté il y a 3 jours ». */
  line: string;
  href: string;
  unseen: boolean;
  shortlisted: boolean;
  /** « À revoir aujourd'hui », « À revoir le 6 nov. », « Classé par vous » (03/11/2026). */
  badge?: { text: string; tone: "due" | "revoir" | "vous" } | null;
  /**
   * Orbi's class in « À trier » (03/11/2026): the compatibility in its colour, and « Pourquoi ? »
   * opens the score part of the file in place of « Voir plus ».
   */
  orbi?: {
    classe: "fort" | "considerer" | "limite" | "hors";
    text: string;
    label: string;
    why: string;
    whyLabel: string;
  } | null;
};

export type RhOrderTexts = {
  more: string;
  moreLabel: string;
  move: string;
  moveDone: string;
  up: string;
  down: string;
  hint: string;
  failed: string;
  unseen: string;
  shortlisted: string;
};

const moved = (ids: string[], from: number, to: number) => {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
};

/**
 * « Candidats » of an offer (Ephraïm, 03/11/2026): one card per person, photo, name, title of the
 * profile and « Voir plus » on the same line. A long press lifts a card, the finger moves it, and
 * the new place is kept for the team. « Déplacer » shows arrows too, for a single tap (WCAG 2.5.7).
 */
export function RhCandidateOrder({
  job,
  rows,
  sortable,
  texts,
}: {
  job: string;
  rows: RhOrderRow[];
  /** False while a search or a filter hides part of the list, or without the right « Trier ». */
  sortable: boolean;
  texts: RhOrderTexts;
}) {
  const [order, setOrder] = useState(() => rows.map((row) => row.id));
  const [arrows, setArrows] = useState(false);
  const [drag, setDrag] = useState<{ id: string; dy: number; to: number; lift: number } | null>(
    null,
  );
  const [, startTransition] = useTransition();
  const list = useRef<HTMLOListElement>(null);
  const hold = useRef<{
    id: string;
    y: number;
    timer: number | null;
    tops: number[];
    heights: number[];
    from: number;
    lifted: boolean;
  } | null>(null);
  const swallowClick = useRef(false);
  const byId = new Map(rows.map((row) => [row.id, row]));
  // A new list from the server (search, filters, another member's move): start from it.
  const key = rows.map((row) => row.id).join(",");
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setOrder(rows.map((row) => row.id));
  }
  const latest = useRef(order);
  useEffect(() => {
    latest.current = order;
  }, [order]);

  const save = (next: string[], before: string[]) => {
    setOrder(next);
    startTransition(async () => {
      const result = await reorderCandidatesAction({ job, ids: next }).catch(() => ({
        ok: false as const,
      }));
      if (!result.ok) {
        setOrder(before);
        showToast({ message: texts.failed, tone: "error" });
      }
    });
  };

  useEffect(() => {
    const element = list.current;
    if (!element || !sortable) return;
    const cancel = () => {
      if (hold.current?.timer) window.clearTimeout(hold.current.timer);
      hold.current = null;
      setDrag(null);
    };
    const lifted = (state: NonNullable<typeof hold.current>) => state.heights[state.from]! + 10;
    const targetOf = (state: NonNullable<typeof hold.current>, dy: number) => {
      const center = state.tops[state.from]! + state.heights[state.from]! / 2 + dy;
      let to = 0;
      state.tops.forEach((top, index) => {
        if (index !== state.from && top + state.heights[index]! / 2 < center) to += 1;
      });
      return to;
    };
    const start = (target: EventTarget | null, y: number) => {
      const card = (target as HTMLElement | null)?.closest<HTMLElement>("[data-cand]");
      if (!card || (target as HTMLElement).closest("button")) return;
      const items = [...element.querySelectorAll<HTMLElement>("[data-cand]")];
      const id = card.dataset.cand!;
      hold.current = {
        id,
        y,
        tops: items.map((item) => item.offsetTop),
        heights: items.map((item) => item.offsetHeight),
        from: items.indexOf(card),
        lifted: false,
        timer: window.setTimeout(() => {
          if (!hold.current) return;
          hold.current.lifted = true;
          swallowClick.current = true;
          navigator.vibrate?.(12);
          setDrag({ id, dy: 0, to: hold.current.from, lift: lifted(hold.current) });
        }, HOLD),
      };
    };
    const move = (y: number, event: Event) => {
      const state = hold.current;
      if (!state) return;
      const dy = y - state.y;
      if (!state.lifted) {
        if (Math.abs(dy) > SLIP) cancel();
        return;
      }
      if (event.cancelable) event.preventDefault();
      setDrag({ id: state.id, dy, to: targetOf(state, dy), lift: lifted(state) });
    };
    const end = (y: number) => {
      const state = hold.current;
      if (!state) return;
      if (state.timer) window.clearTimeout(state.timer);
      hold.current = null;
      if (!state.lifted) return;
      const to = targetOf(state, y - state.y);
      setDrag(null);
      const current = latest.current;
      if (to !== state.from) save(moved(current, state.from, to), current);
      window.setTimeout(() => (swallowClick.current = false), 50);
    };
    const touchStart = (event: TouchEvent) => start(event.target, event.touches[0]!.clientY);
    const touchMove = (event: TouchEvent) => move(event.touches[0]!.clientY, event);
    const touchEnd = (event: TouchEvent) => end(event.changedTouches[0]!.clientY);
    const mouseDown = (event: MouseEvent) => {
      if (event.button === 0) start(event.target, event.clientY);
    };
    const mouseMove = (event: MouseEvent) => move(event.clientY, event);
    const mouseUp = (event: MouseEvent) => end(event.clientY);
    const menu = (event: Event) => {
      if (hold.current) event.preventDefault();
    };
    element.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchend", touchEnd);
    window.addEventListener("touchcancel", cancel);
    element.addEventListener("mousedown", mouseDown);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
    element.addEventListener("contextmenu", menu);
    return () => {
      element.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
      window.removeEventListener("touchcancel", cancel);
      element.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
      element.removeEventListener("contextmenu", menu);
    };
    // `save` reads the latest `job` and texts through the closure of this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortable, job]);

  const from = drag ? order.indexOf(drag.id) : -1;
  const lift = drag?.lift ?? 0;
  const shiftOf = (index: number) => {
    if (!drag || index === from) return 0;
    if (from < drag.to && index > from && index <= drag.to) return -lift;
    if (from > drag.to && index >= drag.to && index < from) return lift;
    return 0;
  };

  return (
    <>
      {sortable ? (
        <div className="nb-rh-co-outils">
          <p className="nb-meta">{texts.hint}</p>
          <button
            type="button"
            className="nb-rh-co-deplacer"
            aria-pressed={arrows}
            onClick={() => setArrows((value) => !value)}
          >
            {arrows ? texts.moveDone : texts.move}
          </button>
        </div>
      ) : null}
      <ol
        ref={list}
        className="nb-rh-co-liste"
        data-glisse={drag ? "" : undefined}
        onClickCapture={(event) => {
          if (swallowClick.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {order.map((id, index) => {
          const row = byId.get(id);
          if (!row) return null;
          const up = drag?.id === id;
          return (
            <li
              key={id}
              data-cand={id}
              data-leve={up ? "" : undefined}
              style={{
                transform:
                  drag && up
                    ? `translateY(${drag.dy}px) scale(1.02)`
                    : `translateY(${shiftOf(index)}px)`,
              }}
            >
              <Link href={row.href} className="nb-rh-co-qui" draggable={false}>
                <span className="nb-rh-co-av">
                  <FilAvatar
                    initials={row.initials}
                    image={row.image}
                    tone={row.tone}
                    org={false}
                    size={46}
                  />
                  {row.unseen ? (
                    <i className="nb-rh-co-nouv" aria-label={texts.unseen} role="img" />
                  ) : null}
                </span>
                <span className="nb-rh-co-t">
                  <b>
                    {row.name}
                    {row.orbi ? (
                      <em
                        className="nb-rh-co-pc"
                        data-classe={row.orbi.classe}
                        aria-label={row.orbi.label}
                      >
                        {row.orbi.text}
                      </em>
                    ) : null}
                  </b>
                  {row.headline ? <span className="nb-rh-co-titre">{row.headline}</span> : null}
                  <small>
                    {row.badge ? (
                      <em className="nb-rh-co-badge" data-ton={row.badge.tone}>
                        {row.badge.text}
                      </em>
                    ) : row.shortlisted ? (
                      <em>{texts.shortlisted}</em>
                    ) : null}
                    {row.line}
                  </small>
                </span>
              </Link>
              {arrows ? (
                <span className="nb-rh-co-fleches">
                  <button
                    type="button"
                    aria-label={`${texts.up} · ${row.name}`}
                    disabled={index === 0}
                    onClick={() => save(moved(order, index, index - 1), order)}
                  >
                    <PhoneIcon name="haut" size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${texts.down} · ${row.name}`}
                    disabled={index === order.length - 1}
                    onClick={() => save(moved(order, index, index + 1), order)}
                  >
                    <PhoneIcon name="bas" size={18} />
                  </button>
                </span>
              ) : row.orbi ? (
                <Link
                  href={row.orbi.why}
                  className="nb-rh-co-plus nb-rh-co-pourquoi"
                  draggable={false}
                  aria-label={`${row.orbi.whyLabel} · ${row.name}`}
                >
                  {row.orbi.whyLabel}
                </Link>
              ) : (
                <Link
                  href={row.href}
                  className="nb-rh-co-plus"
                  draggable={false}
                  aria-label={`${texts.moreLabel} · ${row.name}`}
                >
                  {texts.more}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
