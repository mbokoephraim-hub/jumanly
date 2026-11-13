"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { receivedChart, type ReceivedBar } from "./charts";

export type ReceivedChartBar = ReceivedBar & { long: string };

/**
 * « Candidatures reçues » of the home (`ichart` and `chartInit()` of the prototype): the chart
 * drawn at the size of its box, the line above it that tells the peak, then the bar under the
 * pointer, the bubble with the two figures. A bar opens the candidates.
 */
export function HireReceivedChart({ bars, href }: { bars: ReceivedChartBar[]; href: string }) {
  const t = useTranslations("hireV3Home.chart");
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const peak = bars.reduce<ReceivedChartBar | null>(
    (best, bar) => (!best || bar.received > best.received ? bar : best),
    null,
  );
  const intro =
    peak && peak.received > 0 ? t("peak", { label: peak.long, count: peak.received }) : t("empty");
  const [info, setInfo] = useState(intro);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 50 && h > 80) setSize({ w, h });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = box.current;
    const bubble = tip.current;
    if (!el || !bubble) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const groups = [...el.querySelectorAll<SVGGElement>(".ibar")];
    const cleanups = groups.map((g) => {
      const index = Number(g.dataset.i);
      const bar = bars[index];
      const show = () => {
        if (!bar) return;
        groups.forEach((x) => x.classList.remove("on"));
        g.classList.add("on");
        const r = svg.getBoundingClientRect();
        const br = el.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const sc = Math.min(r.width / vb.width, r.height / vb.height);
        const ox = (r.width - vb.width * sc) / 2;
        const oy = (r.height - vb.height * sc) / 2;
        const x = r.left - br.left + ox + Number(g.dataset.x) * sc;
        const y = r.top - br.top + oy + Number(g.dataset.y) * sc - 8;
        bubble.style.left = `${x}px`;
        bubble.style.top = `${Math.max(40, y)}px`;
        bubble.style.opacity = "1";
        bubble.replaceChildren();
        const title = document.createElement("b");
        title.textContent = bar.label;
        bubble.append(title, document.createElement("br"));
        const line = (colour: string, text: string, last = false) => {
          const swatch = document.createElement("i");
          swatch.style.background = colour;
          bubble.append(swatch, text);
          if (!last) bubble.append(document.createElement("br"));
        };
        line("#A6F26B", t("tipReceived", { count: bar.received }));
        line("#fff", t("tipShortlisted", { count: bar.shortlisted }), true);
        setInfo(
          t("detail", {
            label: bar.long,
            received: bar.received,
            shortlisted: bar.shortlisted,
            rate: bar.received ? Math.round((bar.shortlisted / bar.received) * 100) : 0,
          }),
        );
      };
      const open = () => router.push(href);
      g.addEventListener("mouseenter", show);
      g.addEventListener("focus", show);
      g.addEventListener("click", open);
      return () => {
        g.removeEventListener("mouseenter", show);
        g.removeEventListener("focus", show);
        g.removeEventListener("click", open);
      };
    });
    const leave = () => {
      bubble.style.opacity = "0";
      groups.forEach((x) => x.classList.remove("on"));
    };
    el.addEventListener("mouseleave", leave);
    return () => {
      cleanups.forEach((clean) => clean());
      el.removeEventListener("mouseleave", leave);
    };
  }, [bars, href, router, size, t]);

  return (
    <>
      <div className="meta" id="cinfo" style={{ minHeight: 18 }}>
        {info}
      </div>
      <div className="chartbox" id="cbox" ref={box} style={{ position: "relative" }}>
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{
            __html: receivedChart(bars, t("aria"), size?.w, size?.h),
          }}
        />
        <div className="ctip" id="ctip" ref={tip} style={{ opacity: 0 }} />
      </div>
    </>
  );
}
