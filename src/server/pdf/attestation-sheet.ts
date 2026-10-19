/**
 * The attestation, A4 landscape (docs/refonte-mobile/attestation/, `source/attestation.py`), as one
 * standalone SVG: the same drawing serves the thumbnails (an image), the PDF and the PNG (Chromium).
 * Every security element comes from the number and the fingerprint of the signature: the guilloche
 * background, the rosette behind the name, the drawn signature, the micro-text and the QR code.
 * Texts arrive translated; values are escaped here.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const SAPIN = "#0F3F37";
const LIME = "#A6F26B";
const CREME = "#F7F3EC";
const FEUILLE = "#3DA14F";
const ARDOISE = "#5B6B68";
const W = 1123;
const H = 794;

export type AttestationSheetData = {
  code: string;
  holder: string;
  /** Hexadecimal fingerprint of the signature (seeds every drawing). */
  fingerprint: string;
  /** « A35D-061A-F8D2-7411-559F-319F ». */
  fingerprintShort: string;
  verifyUrl: string;
  skills: string[];
};

export type AttestationSheetLabels = {
  number: string;
  delivered: string;
  title: string;
  subtitle: string;
  intro: string;
  /** May hold <b>…</b>; values inside are already escaped. */
  body: string;
  signer: string;
  signedOn: string;
  fingerprint: string;
  verifyTitle: string;
  verifyText: string;
  footer: string;
  micro: string;
  seal: string;
};

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Deterministic random numbers from the fingerprint (mulberry32). */
function randomFrom(hex: string) {
  let state = Number.parseInt(hex.slice(0, 8) || "0", 16) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    uniform: (min: number, max: number) => min + (max - min) * next(),
    choice: <T>(items: T[]) => items[Math.floor(next() * items.length)]!,
  };
}

const f = (value: number) => value.toFixed(1);
const pts = (points: [number, number][]) =>
  "M" + points.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L");

function rosette(cx: number, cy: number, R: number, r: number, d: number, n: number, phase = 0) {
  const points: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * r * i) / n;
    const x = (R - r) * Math.cos(t + phase) + d * Math.cos(((R - r) / r) * t + phase);
    const y = (R - r) * Math.sin(t + phase) - d * Math.sin(((R - r) / r) * t + phase);
    points.push([cx + x, cy + y]);
  }
  return pts(points);
}

function band(rng: ReturnType<typeof randomFrom>, height: number, width: number, steps: number) {
  const freq = rng.uniform(17, 23);
  const lines: string[] = [];
  for (let k = 0; k < 7; k++) {
    const phase = (k * Math.PI) / 7 + rng.uniform(0, 0.2);
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i * width) / steps;
      points.push([
        x,
        height / 2 +
          (height / 2) *
            Math.sin((2 * Math.PI * freq * x) / width + phase) *
            Math.cos((2 * Math.PI * 3 * x) / width + phase / 2),
      ]);
    }
    lines.push(`<path d="${pts(points)}"/>`);
  }
  return lines.join("");
}

function background(rng: ReturnType<typeof randomFrom>, light: boolean) {
  const lines: string[] = [];
  for (let k = 0; k < (light ? 0 : 60); k++) {
    const y = 14 * k;
    const points: [number, number][] = [];
    for (let x = 0; x <= W + 8; x += 12)
      points.push([x, y + 5 * Math.sin(x / 31 + k * 0.7) + 3 * Math.sin(x / 13 + k)]);
    lines.push(`<path d="${pts(points)}"/>`);
  }
  const R = rng.choice([96, 105, 112]);
  const r = rng.choice([21, 23, 27, 29]);
  const d = rng.uniform(40, 58);
  const rosettes = Array.from(
    { length: 5 },
    (_, k) =>
      `<path d="${rosette(W / 2, 372, R + k * 7, r, d - k * 3, light ? 400 : 1200, k * 0.09)}"/>`,
  ).join("");
  return (
    `<g fill="none" stroke="${SAPIN}" stroke-opacity=".045" stroke-width=".6">${lines.join("")}</g>` +
    `<g fill="none" stroke="${FEUILLE}" stroke-opacity=".10" stroke-width=".55">${rosettes}</g>`
  );
}

/** The drawn signature: a stroke computed from the fingerprint, unique to each attestation. */
function signature(hex: string) {
  const rng = randomFrom(hex.slice(8, 16));
  const points: [number, number][] = [[12, 44]];
  let x = 12;
  let high = true;
  for (let i = 0; i < 11; i++) {
    x += i % 3 === 2 ? rng.uniform(-12, -6) : rng.uniform(16, 26);
    const y = (high ? rng.uniform(14, 24) : rng.uniform(36, 46)) + i * 0.9;
    points.push([x, y]);
    high = !high;
  }
  points.push([x + 22, points[points.length - 1]![1] - 4]);
  let d = `M${f(points[0]![0])} ${f(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 2.6, p1[1] + (p2[1] - p0[1]) / 2.6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 2.6, p2[1] - (p3[1] - p1[1]) / 2.6];
    d += ` C${f(c1[0]!)} ${f(c1[1]!)} ${f(c2[0]!)} ${f(c2[1]!)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return (
    `<path d="${d}" fill="none" stroke="${SAPIN}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M30 60 C80 50 150 66 ${Math.round(x + 30)} 48" fill="none" stroke="${SAPIN}" stroke-width="1.3" stroke-linecap="round"/>`
  );
}

const SYMBOL = `<rect width="120" height="120" rx="30" fill="${SAPIN}"/><g transform="translate(2.25 -4.35) scale(1.1)"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="${LIME}"/></g>`;

function seal(text: string) {
  const teeth = Array.from({ length: 90 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 90;
    return `<path d="M${(60 + 56 * Math.cos(a)).toFixed(2)} ${(60 + 56 * Math.sin(a)).toFixed(2)} L${(60 + 52 * Math.cos(a + 0.07)).toFixed(2)} ${(60 + 52 * Math.sin(a + 0.07)).toFixed(2)}"/>`;
  }).join("");
  return `<circle cx="60" cy="60" r="57" fill="${LIME}"/><g stroke="${SAPIN}" stroke-width="1" stroke-opacity=".5">${teeth}</g>
<circle cx="60" cy="60" r="50" fill="#fff"/><circle cx="60" cy="60" r="50" fill="none" stroke="${SAPIN}" stroke-width="1"/>
<path d="${rosette(60, 60, 30, 7, 14, 600)}" fill="none" stroke="${FEUILLE}" stroke-opacity=".35" stroke-width=".4"/>
<defs><path id="att-cercle" d="M60 60 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0"/></defs>
<text font-family="Sora" font-size="7.4" font-weight="700" letter-spacing="1.6" fill="${SAPIN}"><textPath href="#att-cercle">${escapeXml(text)}</textPath></text>
<g transform="translate(36 36) scale(.4)">${SYMBOL}</g>`;
}

function qr(text: string, size: number) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "Q" });
  const n = modules.size;
  const c = size / n;
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (modules.get(y, x))
        d += `M${(x * c).toFixed(2)} ${(y * c).toFixed(2)}h${c.toFixed(2)}v${c.toFixed(2)}h-${c.toFixed(2)}z`;
  return `<path d="${d}" fill="${SAPIN}"/>`;
}

let logoMarkup: string | null = null;
function logo() {
  logoMarkup ??= readFileSync(
    path.join(process.cwd(), "public/marque/jumanly-logo-principal.svg"),
    "utf8",
  )
    .replace(/<\?xml[^>]*>/, "")
    .replace(/<metadata>[\s\S]*?<\/metadata>/, "")
    .replace(/width="\d+(\.\d+)?" height="\d+(\.\d+)?"/, 'width="173" height="36"');
  return logoMarkup;
}

let fontFace: string | null = null;
/** Sora embedded, so the drawing keeps its font as an image and in Chromium. */
function font() {
  fontFace ??= `@font-face{font-family:Sora;font-weight:300 700;src:url(data:font/woff2;base64,${readFileSync(
    path.join(
      process.cwd(),
      "node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
    ),
  ).toString("base64")}) format('woff2')}`;
  return fontFace;
}

const css = `
.p{position:relative;width:${W}px;height:${H}px;font-family:Sora,system-ui,sans-serif;color:${SAPIN};overflow:hidden}
.p *{box-sizing:border-box;margin:0}
.cadre{position:absolute;inset:22px;border:1.4px solid ${SAPIN};border-radius:6px}
.cadre2{position:absolute;inset:30px;border:.6px solid ${SAPIN};border-radius:3px;opacity:.6}
.micro{position:absolute;left:36px;right:36px;font-size:3.6px;letter-spacing:.35px;white-space:nowrap;overflow:hidden;opacity:.75;font-weight:600}
.micro.h{top:24.5px}.micro.b{bottom:24.5px}
.micro.v{top:36px;bottom:36px;left:auto;right:auto;width:4px;writing-mode:vertical-rl}
.micro.g{left:24px}.micro.d{right:24px}
.coin{position:absolute;width:40px;height:40px;border-color:${LIME};border-style:solid}
.coin.a{top:44px;left:44px;border-width:4px 0 0 4px;border-radius:10px 0 0 0}.coin.b{top:44px;right:44px;border-width:4px 4px 0 0;border-radius:0 10px 0 0}
.coin.c{bottom:44px;left:44px;border-width:0 0 4px 4px;border-radius:0 0 0 10px}.coin.d{bottom:44px;right:44px;border-width:0 4px 4px 0;border-radius:0 0 10px 0}
.tete{position:absolute;top:78px;left:92px;right:92px;display:flex;justify-content:space-between;align-items:center}
.num{text-align:right;font-size:10.5px;line-height:1.5;color:${ARDOISE}}.num b{display:block;font-size:13px;color:${SAPIN};letter-spacing:.06em}
.centre{position:absolute;top:160px;left:120px;right:120px;text-align:center;display:flex;flex-direction:column;align-items:center}
.grand{font-size:50px;font-weight:700;letter-spacing:.22em;line-height:1;padding-left:.22em}
.sous{margin-top:10px;font-size:15px;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:${FEUILLE}}
.trait{width:120px;height:4px;border-radius:2px;background:${LIME};margin:18px 0 16px}
.dec{font-size:13px;color:${ARDOISE};letter-spacing:.04em}
.nom{font-size:44px;font-weight:600;letter-spacing:-.02em;margin:6px 0 12px;line-height:1.15}
.txt{font-size:13.5px;line-height:1.65;max-width:700px;color:#2B4A44}
.txt b{color:${SAPIN};font-weight:600}
.comp{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.comp span{font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(166,242,107,.35);border:1px solid rgba(15,63,55,.15)}
.pied{position:absolute;left:92px;right:92px;bottom:96px;display:grid;grid-template-columns:1fr 150px 1fr;align-items:end;gap:20px}
.sig{font-size:10px;color:${ARDOISE};line-height:1.5}.sig b{display:block;font-size:11.5px;color:${SAPIN}}
.sig .ligne{width:210px;border-top:1px solid ${SAPIN};margin:2px 0 6px}
.emp{font-size:8.5px;letter-spacing:.06em;color:${SAPIN};font-weight:600}
.sceau{display:flex;justify-content:center;margin-bottom:-6px}
.verif{display:flex;gap:12px;align-items:flex-end;justify-content:flex-end;text-align:right;font-size:10px;color:${ARDOISE};line-height:1.5}
.verif b{display:block;color:${SAPIN};font-size:11.5px}
.verif .qr{display:block;padding:6px;background:#fff;border-radius:8px;border:1px solid rgba(15,63,55,.2)}
.base{position:absolute;left:0;right:0;bottom:72px;text-align:center;font-size:8.5px;color:${ARDOISE};letter-spacing:.04em}`;

/**
 * The whole attestation, 1123 × 794 (A4 landscape at 96 dpi). `light` draws fewer lines, for the
 * thumbnails of the app on a slow network; the PDF always has every line.
 */
export function attestationSvg(
  data: AttestationSheetData,
  labels: AttestationSheetLabels,
  { light = false }: { light?: boolean } = {},
) {
  const rng = randomFrom(data.fingerprint);
  const micro = escapeXml(labels.micro.repeat(14));
  const bandSvg = (cls: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:36px;right:36px;${cls}:40px;width:${W - 72}px;height:24px" viewBox="0 0 ${W - 72} 24" preserveAspectRatio="none"><g fill="none" stroke="${FEUILLE}" stroke-opacity=".35" stroke-width=".5">${band(rng, 24, W - 72, light ? 180 : 700)}</g></svg>`;
  const skills = data.skills.map((skill) => `<span>${escapeXml(skill)}</span>`).join("");
  const html = `<div xmlns="http://www.w3.org/1999/xhtml" class="p">
${bandSvg("top")}${bandSvg("bottom")}
<div class="cadre"></div><div class="cadre2"></div>
<div class="micro h">${micro}</div><div class="micro b">${micro}</div>
<div class="micro v g">${micro}</div><div class="micro v d">${micro}</div>
<span class="coin a"></span><span class="coin b"></span><span class="coin c"></span><span class="coin d"></span>
<div class="tete">${logo()}<div class="num"><b>${escapeXml(labels.number)}</b>${escapeXml(labels.delivered)}</div></div>
<div class="centre">
<div class="grand">${escapeXml(labels.title)}</div><div class="sous">${escapeXml(labels.subtitle)}</div><span class="trait"></span>
<div class="dec">${escapeXml(labels.intro)}</div>
<div class="nom">${escapeXml(data.holder)}</div>
<p class="txt">${labels.body}</p>
${skills ? `<div class="comp">${skills}</div>` : ""}
</div>
<div class="pied">
<div class="sig"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 72" width="210" height="66">${signature(data.fingerprint)}</svg><div class="ligne"></div><b>${escapeXml(labels.signer)}</b>${escapeXml(labels.signedOn)}<div class="emp">${escapeXml(labels.fingerprint)}</div></div>
<div class="sceau"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="132" height="132">${seal(labels.seal)}</svg></div>
<div class="verif"><div><b>${escapeXml(labels.verifyTitle)}</b>${escapeXml(labels.verifyText)}<br/>${escapeXml(data.verifyUrl.replace(/^https?:\/\//, ""))}</div><span class="qr"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 82" width="82" height="82">${qr(data.verifyUrl, 82)}</svg></span></div>
</div>
<div class="base">${escapeXml(labels.footer)}</div>
</div>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(`${labels.title} ${labels.subtitle} · ${data.holder} · ${data.code}`)}">
<style>${font()}${css}</style>
<rect width="${W}" height="${H}" fill="${CREME}"/>
${background(rng, light)}
<svg x="${W - 346}" y="190" width="260" height="350" viewBox="23.5 19.5 58 78" opacity=".03"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="${SAPIN}" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="${SAPIN}"/></svg>
<foreignObject x="0" y="0" width="${W}" height="${H}">${html}</foreignObject>
</svg>`;
}

/** A page that Chromium prints to PDF (A4 landscape) or captures as an image. */
export function attestationPage(svg: string, title: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeXml(title)}</title>
<style>@page{size:297mm 210mm;margin:0}html,body{margin:0;background:${CREME};-webkit-print-color-adjust:exact;print-color-adjust:exact}body>svg{display:block;width:297mm;height:210mm}</style>
</head><body>${svg}</body></html>`;
}
