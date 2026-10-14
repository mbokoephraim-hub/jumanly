/**
 * Accent colours and fonts of the CV templates (SPECIFICATION-MODELES-CV.md § 4.1 and § 4.2).
 * The brand colours (Sapin #0F3F37, Lime #A6F26B) are not in the palette: a downloaded CV is the
 * person's document.
 */

export const cvColors = [
  { code: "encre", hex: "#1F2933", ats: true },
  { code: "marine", hex: "#1B365D", ats: true },
  { code: "petrole", hex: "#0B4F5C", ats: true },
  { code: "foret", hex: "#24503A", ats: true },
  { code: "bordeaux", hex: "#6B1E2E", ats: true },
  { code: "prune", hex: "#4A2545", ats: true },
  { code: "brun", hex: "#5A3A22", ats: true },
  { code: "graphite", hex: "#3D434A", ats: true },
  { code: "bleu", hex: "#1D5FBF", ats: false },
  { code: "turquoise", hex: "#0E7C86", ats: false },
  { code: "vert", hex: "#2E7D32", ats: false },
  { code: "brique", hex: "#B23A2B", ats: false },
  { code: "orange", hex: "#B4530A", ats: false },
  { code: "violet", hex: "#6D3FB3", ats: false },
  { code: "framboise", hex: "#B0285F", ats: false },
  { code: "acier", hex: "#4F6D8A", ats: false },
] as const;

export type CvColorCode = (typeof cvColors)[number]["code"];

/** WCAG minimum for normal text: a lighter custom colour is refused. */
export const MIN_CONTRAST = 4.5;

export const cvFonts = [
  { code: "sora", family: "Sora", label: "Sora", serif: false, weights: [300, 400, 500, 600, 700] },
  { code: "inter", family: "Inter", label: "Inter", serif: false, weights: [400, 500, 600, 700] },
  {
    code: "source-sans",
    family: "Source Sans 3",
    label: "Source Sans 3",
    serif: false,
    weights: [400, 600, 700],
  },
  { code: "lato", family: "Lato", label: "Lato", serif: false, weights: [400, 700] },
  {
    code: "merriweather",
    family: "Merriweather",
    label: "Merriweather",
    serif: true,
    weights: [400, 700],
  },
  { code: "lora", family: "Lora", label: "Lora", serif: true, weights: [400, 600, 700] },
] as const;

export type CvFontCode = (typeof cvFonts)[number]["code"];
export const RECOMMENDED_FONT: CvFontCode = "sora";

export function fontOf(code: string) {
  return cvFonts.find((font) => font.code === code) ?? cvFonts[0];
}

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string) {
  return HEX.test(value);
}

function channels(hex: string) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio of a colour on white (WCAG 2), rounded to one decimal. */
export function contrastOnWhite(hex: string) {
  return Math.round((1.05 / (luminance(hex) + 0.05)) * 10) / 10;
}

function exactContrast(hex: string) {
  return 1.05 / (luminance(hex) + 0.05);
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) =>
      Math.round(Math.min(1, Math.max(0, value)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function rgbToHsl([r, g, b]: [number, number, number]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l] as const;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h, s, l] as const;
}

function hslToHex(h: number, s: number, l: number) {
  if (s === 0) return toHex(l, l, l);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return toHex(hue(h + 1 / 3), hue(h), hue(h - 1 / 3));
}

/**
 * Closest colour that passes: same hue and saturation, lightness lowered step by step
 * (§ 4.1, « la teinte la plus proche qui passe »).
 */
export function darkenToContrast(hex: string, min = MIN_CONTRAST) {
  if (exactContrast(hex) >= min) return hex.toUpperCase();
  const [h, s, l] = rgbToHsl(channels(hex));
  for (let lightness = l; lightness >= 0; lightness -= 0.005) {
    const candidate = hslToHex(h, s, lightness);
    if (exactContrast(candidate) >= min) return candidate;
  }
  return "#000000";
}

/** Hex value of an accent: a palette code or a custom `#RRGGBB`. Null when invalid or too light. */
export function accentHex(accent: string): string | null {
  const known = cvColors.find((color) => color.code === accent);
  if (known) return known.hex;
  if (!isHexColor(accent)) return null;
  return exactContrast(accent) >= MIN_CONTRAST ? accent.toUpperCase() : null;
}

/** Brand colours that never appear in a CV (neutrality test, § 11 point 4). */
export const brandColors = ["#0F3F37", "#A6F26B"] as const;
