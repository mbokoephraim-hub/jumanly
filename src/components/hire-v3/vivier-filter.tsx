"use client";

import { useEffect, useRef } from "react";

type Criteria = Record<string, string[]>;

/**
 * The criteria and the search of the Vivier (`vApply()` and the click handlers of the prototype
 * v3): a criterion tab shows its options, an option (or a pool of the donut, or « à renouveler »)
 * toggles, the search filters as one types, « Effacer » clears. The cards are rendered by the
 * server with their values in `data-*`; this only hides the ones that do not match.
 */
export function VivierFilter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(".content");
    if (!root) return;
    const crit: Criteria = {};
    const input = root.querySelector<HTMLInputElement>("#vsq");
    const all = <T extends Element = HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T & Element>(selector)) as T[];
    const showTab = (key: string) => {
      for (const b of all<HTMLElement>(".vct")) b.classList.toggle("on", b.dataset.vct === key);
      for (const p of all<HTMLElement>(".vcp")) p.classList.toggle("on", p.dataset.vcp === key);
    };
    const apply = () => {
      const q = (input?.value ?? "").trim().toLowerCase();
      let n = 0;
      for (const el of all<HTMLElement>(".vc")) {
        const d = el.dataset;
        let ok = !q || q.split(/\s+/).every((w) => (d.q ?? "").includes(w));
        for (const [key, values] of Object.entries(crit)) {
          if (!values.length) continue;
          if (key === "comp") ok &&= values.every((v) => (d.comp ?? "").split("|").includes(v));
          else if (key === "sc") ok &&= Number(d.sc) >= Math.min(...values.map(Number));
          else ok &&= values.includes(d[key] ?? "");
        }
        el.hidden = !ok;
        if (ok) n++;
      }
      const empty = root.querySelector<HTMLElement>(".vempty");
      if (empty) empty.hidden = n > 0;
      const count = root.querySelector<HTMLElement>("[data-vcount]");
      if (count) count.textContent = String(n);
      const label = root.querySelector<HTMLElement>("[data-vcount-label]");
      if (label) label.textContent = ` ${n > 1 ? label.dataset.other : label.dataset.one}`;
      for (const b of all<HTMLElement>("[data-vcv]")) {
        const [key = "", value = ""] = (b.dataset.vcv ?? "").split(":");
        b.classList.toggle("on", (crit[key] ?? []).includes(value));
      }
      for (const e of all<HTMLElement>("[data-vcn]")) {
        const l = (crit[e.dataset.vcn ?? ""] ?? []).length;
        e.textContent = l ? String(l) : "";
        e.hidden = !l;
      }
      const any = Boolean(q) || Object.values(crit).some((v) => v.length);
      root.querySelector(".vclr")?.classList.toggle("show", any);
      const doms = crit.dom ?? [];
      for (const g of all<SVGElement>(".vdon [data-seg]"))
        g.style.opacity = !doms.length || doms.includes(g.dataset.seg ?? "") ? "1" : ".25";
    };
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-vcv],[data-vct],[data-vclr]",
      );
      if (!target || !root.contains(target)) return;
      const d = target.dataset;
      if (d.vcv) {
        const [key = "", value = ""] = d.vcv.split(":");
        const list = (crit[key] ??= []);
        const i = list.indexOf(value);
        if (i < 0) list.push(value);
        else list.splice(i, 1);
        if (target.closest(".vh-r")) showTab(key);
        apply();
      } else if (d.vct) showTab(d.vct);
      else if (d.vclr !== undefined) {
        for (const key of Object.keys(crit)) delete crit[key];
        if (input) input.value = "";
        apply();
      }
    };
    const onSubmit = (event: Event) => {
      if ((event.target as Element).closest(".vph")) event.preventDefault();
    };
    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit);
    input?.addEventListener("input", apply);
    apply();
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("submit", onSubmit);
      input?.removeEventListener("input", apply);
    };
  }, []);
  return <span ref={ref} hidden />;
}
