"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";
import { HireIcon } from "./icon";

/**
 * A block that scrolls inside itself (`.sc` and `scInit()` of the prototype): its own thin rail,
 * the fades at the top and bottom, and « N de plus » that scrolls on.
 */
export function HireScrollBox({
  children,
  className,
  more = true,
  rail = true,
}: {
  children: ReactNode;
  className?: string;
  more?: boolean;
  rail?: boolean;
}) {
  const t = useTranslations("hireV3Home");
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const sc = box.current;
    const inn = inner.current;
    if (!sc || !inn) return;
    const update = () => {
      const max = inn.scrollHeight - inn.clientHeight;
      sc.classList.toggle("none", max < 4);
      sc.classList.toggle("end", max >= 4 && inn.scrollTop >= max - 4);
      sc.classList.toggle("mid", inn.scrollTop > 4 && inn.scrollTop < max - 4);
      if (thumb.current && railRef.current) {
        const rh = railRef.current.clientHeight;
        const tl = Math.max(24, (rh * inn.clientHeight) / Math.max(inn.scrollHeight, 1));
        thumb.current.style.height = `${tl}px`;
        thumb.current.style.top = `${max > 0 ? ((rh - tl) * inn.scrollTop) / max : 0}px`;
      }
      if (label.current) {
        const items = [...inn.querySelectorAll<HTMLElement>(".task,.kc,.nt,.cv,.ofr")];
        const hidden = items.filter(
          (item) => item.offsetTop + item.offsetHeight / 2 > inn.scrollTop + inn.clientHeight,
        ).length;
        label.current.textContent = hidden ? t("more", { count: hidden }) : t("seeMore");
      }
    };
    inn.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    const timer = window.setTimeout(update, 300);
    return () => {
      inn.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(timer);
    };
  }, [t]);
  return (
    <div className={className ? `sc ${className}` : "sc"} data-sc="" ref={box}>
      <div className="sc-in" ref={inner}>
        {children}
      </div>
      {rail ? (
        <div className="sc-rail" ref={railRef}>
          <i className="sc-thumb" ref={thumb} />
        </div>
      ) : null}
      {more ? (
        <button
          type="button"
          className="sc-more"
          data-scmore=""
          onClick={() =>
            inner.current?.scrollBy({ top: inner.current.clientHeight * 0.7, behavior: "smooth" })
          }
        >
          <HireIcon name="down" size="s" />
          <span ref={label} />
        </button>
      ) : null}
    </div>
  );
}
