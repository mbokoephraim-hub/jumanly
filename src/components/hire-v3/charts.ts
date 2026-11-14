/**
 * The charts of the recruiter's web app v3, ported as they are from the prototype
 * (docs/mvp-web-recruteur/prototype-v3/code/hire-v3.js: `nice`, `smooth`, `ichart`, `funnel`,
 * `lineChart`, `donut`, `ring`, `spark`): same geometry, same colours. They return SVG markup for
 * `dangerouslySetInnerHTML`; every text that comes from the data goes through `esc`.
 */

export function esc(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function nice(v: number, t = 4) {
  const raw = Math.max(v, 1) / t;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  // The charts count people: never a step under 1 (no « 0.5 » or « 1.5 » on an empty axis).
  const st = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p);
  return { max: Math.ceil(v / st) * st || st * t, step: st };
}

export function smooth(pts: [number, number][]) {
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(1)},${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)},${c2[1]!.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** One bar of « Candidatures reçues »: its label, the applications received, those shortlisted. */
export type ReceivedBar = { label: string; received: number; shortlisted: number };

/** « Candidatures reçues » of the home (`ichart`): hatched Lime bars, the shortlisted part in ink. */
export function receivedChart(bars: ReceivedBar[], aria: string, w = 520, h = 230) {
  const pl = 26;
  const pb = 22;
  const pt = 10;
  const iw = w - pl - 6;
  const ih = h - pb - pt;
  const n = Math.max(bars.length, 1);
  const NK = nice(Math.max(1, ...bars.map((b) => b.received)) * 1.1);
  const m = NK.max;
  const slot = iw / n;
  const bw = Math.min(46, slot * 0.5);
  let g = `<defs><pattern id="ht2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#A6F26B"/><line x1="0" y1="0" x2="0" y2="8" stroke="#86DA4C" stroke-width="3"/></pattern></defs>`;
  const tk = Math.round(m / NK.step);
  for (let i = 0; i <= tk; i++) {
    const v = +(NK.step * i).toFixed(1);
    const y = pt + ih - (ih * i) / tk;
    g += `<line x1="${pl}" x2="${w - 6}" y1="${y}" y2="${y}" stroke="#E7ECDD" ${i ? 'stroke-dasharray="3 4"' : ""}/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#7B8A83">${v}</text>`;
  }
  bars.forEach((b, i) => {
    const cx = pl + slot * (i + 0.5);
    const tot = (ih * b.received) / m;
    const pre = (ih * b.shortlisted) / m;
    const y0 = pt + ih;
    g += `<g class="ibar" data-i="${i}" data-l="${esc(b.label)}" data-v="${b.received}" data-p="${b.shortlisted}" data-x="${cx}" data-y="${y0 - tot}" tabindex="0"><rect class="hl" x="${cx - slot / 2 + 3}" y="${pt}" width="${slot - 6}" height="${ih}" rx="12" fill="transparent"/>
  <g class="gb" style="animation-delay:${i * 70}ms">${b.received ? `<rect x="${cx - bw / 2}" y="${y0 - tot}" width="${bw}" height="${Math.max(6, tot - pre - 3)}" rx="${Math.min(12, bw / 2)}" fill="url(#ht2)"/>` : ""}${b.shortlisted ? `<rect x="${cx - bw / 2}" y="${y0 - pre}" width="${bw}" height="${Math.max(4, pre)}" rx="${Math.min(12, bw / 2)}" fill="#0E1B17"/>` : ""}</g>
  <text x="${cx}" y="${h - 5}" text-anchor="middle" font-size="12" fill="#56665F">${esc(b.label)}</text><rect class="hit" x="${cx - slot / 2}" y="0" width="${slot}" height="${h}"/></g>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(aria)}">${g}</svg>`;
}

/** A stage of « Où en sont vos candidats »: its name, its count, its colour. */
export type FunnelStage = { label: string; count: number; colour: string; href: string };

/** The funnel of the home (`funnel`): smooth band from stage to stage, the rate between two. */
export function funnelSvg(stages: FunnelStage[]) {
  const W = 1000;
  const H = 120;
  const M = H / 2;
  const mx = Math.max(1, ...stages.map((x) => x.count));
  const n = stages.length;
  const col = W / n;
  const hh = stages.map((x) => Math.max(9, (H / 2 - 4) * Math.sqrt(x.count / mx)));
  const top: [number, number][] = [
    [0, M - hh[0]!],
    ...stages.map((_, i) => [col * (i + 0.5), M - hh[i]!] as [number, number]),
    [W, M - hh[n - 1]!],
  ];
  const bot = top.map((p) => [p[0], 2 * M - p[1]] as [number, number]).reverse();
  const stops = stages
    .map((x, i) => `<stop offset="${(i + 0.5) / n}" stop-color="${x.colour}"/>`)
    .join("");
  const shape = `${smooth(top)} ${smooth(bot).replace(/^M/, "L")}Z`;
  return `<svg class="fn-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="fng" x1="0" x2="1">${stops}</linearGradient><linearGradient id="fnl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="fnc"><rect class="fn-clip" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#fnc)"><path d="${shape}" fill="url(#fng)"/><path d="${shape}" fill="url(#fnl)"/></g>${stages
    .slice(1)
    .map(
      (_, i) =>
        `<line x1="${col * (i + 1)}" x2="${col * (i + 1)}" y1="0" y2="${H}" stroke="#fff" stroke-width="3" vector-effect="non-scaling-stroke"/>`,
    )
    .join("")}</svg>`;
}

/** The ring of a score (`ring`): green from 75, amber from 50, grey-blue below. */
export function ringHtml(p: number, size = 40, th = 4, colour?: string) {
  const col = colour ?? (p >= 75 ? "#2FA25A" : p >= 50 ? "#D9901A" : "#8C9AB8");
  const r = size / 2 - th / 2;
  const c = 2 * Math.PI * r;
  return `<span class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EEF2E6" stroke-width="${th}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${th}" stroke-linecap="round" stroke-dasharray="${(c * p) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><b style="font-size:${size > 60 ? 20 : 12}px">${p}${size > 60 ? "%" : ""}</b></span>`;
}

/** A small trend line (`spark`), its last point in Lime. */
export function sparkSvg(d: number[], w = 120, h = 36, col = "#0F3F37") {
  if (d.length < 2) d = [d[0] ?? 0, d[0] ?? 0];
  const m = Math.max(...d);
  const mi = Math.min(...d);
  const pts = d.map(
    (v, i) =>
      [
        +((i * (w - 6)) / (d.length - 1) + 3).toFixed(1),
        +(h - 4 - ((h - 8) * (v - mi)) / (m - mi || 1)).toFixed(1),
      ] as [number, number],
  );
  const l = pts[pts.length - 1]!;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${smooth(pts)}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/><circle cx="${l[0]}" cy="${l[1]}" r="3.5" fill="#A6F26B" stroke="${col}" stroke-width="1.5"/></svg>`;
}

/** A donut of shares (`donut`): segments in their colours, a label and a line under it. */
export function donutSvg(
  segs: [number, string][],
  size = 150,
  label = "",
  sub = "",
  th = 18,
  dark = false,
) {
  const r = size / 2 - th / 2 - 2;
  const c = 2 * Math.PI * r;
  const tot = segs.reduce((a, s) => a + s[0], 0) || 1;
  let off = 0;
  let g = "";
  segs.forEach(([v, col]) => {
    const len = (c * v) / tot;
    g += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${th}" stroke-dasharray="${Math.max(0, len - 3)} ${c}" stroke-dashoffset="${-off}" stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"><animate attributeName="stroke-dasharray" from="0 ${c}" to="${Math.max(0, len - 3)} ${c}" dur=".9s" fill="freeze"/></circle>`;
    off += len;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" style="flex:none"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${dark ? "rgba(255,255,255,.08)" : "#EEF2E6"}" stroke-width="${th}"/>${g}<text x="50%" y="${sub ? size / 2 + 2 : size / 2 + 7}" text-anchor="middle" font-family="Sora,sans-serif" font-weight="600" font-size="${size > 120 ? 26 : 18}" fill="${dark ? "#fff" : "#0E1B17"}">${esc(label)}</text>${sub ? `<text x="50%" y="${size / 2 + 20}" text-anchor="middle" font-size="11" fill="${dark ? "#A8BDB5" : "#56665F"}">${esc(sub)}</text>` : ""}</svg>`;
}

/** A line in time (`lineChart`): the period in ink over a Lime fill, the one before dashed. */
export function lineChartSvg({
  data,
  labels,
  h = 220,
  w = 620,
  data2 = null,
  tipAt = null,
  unit = "",
}: {
  data: number[];
  labels: [number, string][];
  h?: number;
  w?: number;
  data2?: number[] | null;
  tipAt?: number | null;
  unit?: string;
}) {
  if (data.length < 2) data = [data[0] ?? 0, data[0] ?? 0];
  const pl = 34;
  const pb = 26;
  const pt = 16;
  const iw = w - pl - 10;
  const ih = h - pb - pt;
  const NK = nice(Math.max(1, ...data, ...(data2 ?? [])) * 1.1);
  const m = NK.max;
  const X = (i: number) => pl + (iw * i) / (data.length - 1);
  const Y = (v: number) => pt + ih - (ih * v) / m;
  let g = "";
  for (let i = 0; i <= m / NK.step; i++) {
    const v = +(NK.step * i).toFixed(1);
    const y = Y(v);
    g += `<line x1="${pl}" x2="${w - 10}" y1="${y}" y2="${y}" stroke="#E7ECDD" ${i ? 'stroke-dasharray="3 4"' : ""}/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#7B8A83">${v}</text>`;
  }
  labels.forEach(([i, l]) => {
    g += `<text x="${X(i)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#7B8A83">${esc(l)}</text>`;
  });
  const pts = data.map((v, i) => [+X(i).toFixed(1), +Y(v).toFixed(1)] as [number, number]);
  const d = smooth(pts);
  g += `<defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#A6F26B" stop-opacity=".55"/><stop offset="1" stop-color="#A6F26B" stop-opacity="0"/></linearGradient></defs><path d="${d} L${X(data.length - 1)},${pt + ih} L${pl},${pt + ih} Z" fill="url(#lg)"/>`;
  if (data2 && data2.length === data.length) {
    const p2 = data2.map((v, i) => [+X(i).toFixed(1), +Y(v).toFixed(1)] as [number, number]);
    g += `<path class="ln" style="--len:1400" d="${smooth(p2)}" fill="none" stroke="#0F3F37" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/>`;
  }
  g += `<path class="ln" style="--len:1600" d="${d}" fill="none" stroke="#0E1B17" stroke-width="2.6" stroke-linecap="round"/>`;
  const ti = tipAt ?? data.length - 1;
  const [tx, ty] = pts[ti]!;
  const bx = Math.min(w - 98, Math.max(pl, tx - 44));
  g += `<g class="tip"><line x1="${tx}" x2="${tx}" y1="${ty}" y2="${pt + ih}" stroke="#0E1B17" stroke-dasharray="3 3" opacity=".4"/><rect x="${bx}" y="${ty - 40}" width="88" height="26" rx="13" fill="#0E1B17"/><text x="${bx + 44}" y="${ty - 23}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(String(data[ti]).replace(".", ","))} ${esc(unit)}</text><circle cx="${tx}" cy="${ty}" r="6" fill="#A6F26B" stroke="#0E1B17" stroke-width="2.5"/></g>`;
  g += `<rect class="hover" x="${pl}" y="${pt}" width="${iw}" height="${ih}" fill="transparent" data-pts='${JSON.stringify(pts)}' data-v='${JSON.stringify(data)}' data-u="${esc(unit)}" data-b="${pt + ih}"/>`;
  return `<svg class="chart lc" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}

/** Round bars (`barsWave`): one bar per label, the highlighted one in Lime with its figure. */
export function barsWaveSvg({
  data,
  h = 200,
  w = 560,
  dark = false,
  hi = -1,
  unit = "",
}: {
  data: [string, number][];
  h?: number;
  w?: number;
  dark?: boolean;
  hi?: number;
  unit?: string;
}) {
  const pl = 30;
  const pb = 26;
  const pt = 12;
  const iw = w - pl - 8;
  const ih = h - pb - pt;
  const n = data.length;
  const bw = Math.min(34, (iw / n) * 0.56);
  const NK = nice(Math.max(1, ...data.map((d) => d[1])) * 1.12);
  const m = NK.max;
  const tc = dark ? "#8FA59D" : "#7B8A83";
  const gc = dark ? "rgba(255,255,255,.07)" : "#E7ECDD";
  let g = "";
  const ticks = Math.round(m / NK.step);
  for (let i = 0; i <= ticks; i++) {
    const v = +(NK.step * i).toFixed(1);
    const y = pt + ih - (ih * i) / ticks;
    g += `<line x1="${pl}" x2="${w - 8}" y1="${y}" y2="${y}" stroke="${gc}" ${i ? 'stroke-dasharray="3 4"' : ""}/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${tc}">${v}</text>`;
  }
  data.forEach((d, i) => {
    const cx = pl + (iw / n) * (i + 0.5);
    const bh = Math.max(4, (ih * d[1]) / m);
    const y = pt + ih - bh;
    const isH = i === hi;
    g += `<g><title>${esc(d[0])} : ${d[1]}${esc(unit)}</title><rect class="gb" style="animation-delay:${i * 50}ms" x="${cx - bw / 2}" y="${y}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="${isH ? "#A6F26B" : dark ? "#FFFFFF" : "#0F3F37"}" ${isH ? "" : `opacity="${dark ? 0.92 : 1}"`}/>
    ${isH ? `<rect x="${cx - bw / 2 - 1}" y="${y - 30}" width="${bw + 2}" height="22" rx="11" fill="${dark ? "#fff" : "#0E1B17"}"/><text x="${cx}" y="${y - 15}" text-anchor="middle" font-size="11" font-weight="700" fill="${dark ? "#0E1B17" : "#fff"}">${d[1]}</text>` : ""}
    <text x="${cx}" y="${h - 6}" text-anchor="middle" font-size="12" fill="${tc}">${esc(d[0])}</text></g>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
}

/** A radar (`radar` of the prototype): the axes, then each series as a polygon. */
export function radarSvg(
  axes: string[],
  series: { v: number[]; stroke: string; fill?: string; w?: number; dash?: boolean }[],
  size = 320,
) {
  const cx = size / 2;
  const cy = size / 2 + 4;
  const R = size / 2 - 58;
  const n = Math.max(axes.length, 3);
  const A = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, v: number) => [
    cx + ((R * v) / 100) * Math.cos(A(i)),
    cy + ((R * v) / 100) * Math.sin(A(i)),
  ];
  let g = "";
  [25, 50, 75, 100].forEach((l) => {
    g += `<polygon points="${axes.map((_, i) => pt(i, l).join(",")).join(" ")}" fill="none" stroke="#E2E8D6"/>`;
  });
  axes.forEach((a, i) => {
    const [x, y] = pt(i, 100);
    const [lx, ly] = pt(i, 124);
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E2E8D6"/><text x="${lx}" y="${ly! + 4}" text-anchor="middle" font-size="12" font-weight="600" fill="#33443E">${esc(a)}</text>`;
  });
  series.forEach((s) => {
    const p = s.v.map((v, i) => pt(i, v).join(",")).join(" ");
    g += `<polygon points="${p}" fill="${s.fill ?? "none"}" stroke="${s.stroke}" stroke-width="${s.w ?? 2}" ${s.dash ? 'stroke-dasharray="5 4"' : ""} stroke-linejoin="round" style="transform-origin:${cx}px ${cy}px;animation:hv3-pop .8s cubic-bezier(.2,.8,.2,1) both"/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${size} ${size}" role="img" style="max-width:${size}px;margin:auto">${g}</svg>`;
}

/** The half gauge of a score (`arcG` of the prototype). */
export function arcSvg(score: number) {
  const R = 78;
  const L = Math.PI * R;
  const dots = [0, 25, 50, 75, 100]
    .map((v) => {
      const a = Math.PI * (1 - v / 100);
      return `<circle cx="${100 + R * Math.cos(a)}" cy="${100 - R * Math.sin(a)}" r="1.6" fill="#fff"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 200 116" class="arcg"><defs><linearGradient id="agr" x1="0" x2="1"><stop offset="0" stop-color="#D9FA72"/><stop offset=".6" stop-color="#7DE36B"/><stop offset="1" stop-color="#1E9A64"/></linearGradient></defs><path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="#EEF2E6" stroke-width="16" stroke-linecap="round"/><path class="arcp" d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="url(#agr)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - score / 100)}" style="--L:${L}"/>${dots}</svg>`;
}

/** The filled trend of a report tile (`sparkFill`), without its label (the caller words it). */
export function sparkFillSvg(v: number[]) {
  const values = v.length < 2 ? [v[0] ?? 0, v[0] ?? 0] : v;
  const w = 300;
  const h = 100;
  const m = Math.max(...values, 1) * 1.15;
  const pts = values.map(
    (y, i) => [(i * w) / (values.length - 1), h - (h * y) / m] as [number, number],
  );
  const d = smooth(pts);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#A6F26B" stop-opacity=".55"/><stop offset="1" stop-color="#A6F26B" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#spg)"/><path d="${d}" fill="none" stroke="#0F3F37" stroke-width="2.2" vector-effect="non-scaling-stroke" class="draw"/></svg>`;
}
