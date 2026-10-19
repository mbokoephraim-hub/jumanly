import { cx } from "@/lib/cx";

/**
 * Drawings of the talent space, copied from the planches (docs/refonte-mobile/maquette/source/
 * build.py: BAN, FORM). Decorative: the company or the course is always named next to them. A
 * company without a banner of its own gets one of the four patterns, always the same for it.
 */
const banners = {
  sap: '<rect width="300" height="90" fill="#0F3F37"/><g fill="none" stroke="#A6F26B" stroke-opacity=".35"><circle cx="250" cy="10" r="28"/><circle cx="250" cy="10" r="52"/><circle cx="250" cy="10" r="78"/></g><circle cx="250" cy="10" r="10" fill="#A6F26B"/>',
  amb: '<rect width="300" height="90" fill="#FFE1A1"/><rect y="55" width="300" height="35" fill="#F8C35A"/><circle cx="235" cy="58" r="34" fill="#FFF4D6"/>',
  mer: '<rect width="300" height="90" fill="#CFE4F7"/><g fill="none" stroke="#1E4E79" stroke-opacity=".4" stroke-width="3"><path d="M0 50 Q75 25 150 50 T300 50"/><path d="M0 68 Q75 43 150 68 T300 68"/><path d="M0 32 Q75 7 150 32 T300 32"/></g>',
  kiv: '<rect width="300" height="90" fill="#C9F1E3"/><path d="M0 90 L70 30 L120 66 L190 18 L300 82 V90Z" fill="#2FD3A6" opacity=".55"/><path d="M0 90 L110 52 L170 78 L300 60 V90Z" fill="#14745F" opacity=".6"/>',
  oppo: '<rect width="300" height="90" fill="#F8CF73"/><circle cx="260" cy="90" r="70" fill="#FFE7B0"/><g fill="none" stroke="#0F3F37" stroke-opacity=".18" stroke-width="2"><circle cx="40" cy="20" r="30"/><circle cx="40" cy="20" r="50"/></g>',
} as const;

const courses = {
  cv: '<rect width="300" height="130" fill="#D9F7B6"/><circle cx="250" cy="20" r="60" fill="#C3F38E"/><g transform="translate(108 18) rotate(-6)"><rect width="84" height="104" rx="8" fill="#fff"/><circle cx="20" cy="22" r="10" fill="#A6F26B"/><rect x="36" y="16" width="38" height="6" rx="3" fill="#0F3F37"/><rect x="36" y="26" width="26" height="4" rx="2" fill="#9AA9A5"/><g fill="#DCE5E1"><rect x="12" y="44" width="60" height="5" rx="2"/><rect x="12" y="54" width="48" height="5" rx="2"/><rect x="12" y="68" width="60" height="5" rx="2"/><rect x="12" y="78" width="40" height="5" rx="2"/></g></g>',
  entretien:
    '<rect width="300" height="130" fill="#C9F1E3"/><circle cx="40" cy="120" r="70" fill="#93E8CD"/><rect x="150" y="22" width="120" height="44" rx="22" fill="#fff"/><rect x="168" y="38" width="70" height="6" rx="3" fill="#0F3F37"/><rect x="168" y="48" width="46" height="5" rx="2" fill="#9AA9A5"/><rect x="40" y="80" width="110" height="36" rx="18" fill="#0F3F37"/><rect x="58" y="93" width="64" height="6" rx="3" fill="#A6F26B"/>',
  numerique:
    '<rect width="300" height="130" fill="#FFEBC2"/><circle cx="260" cy="10" r="70" fill="#F8CF73"/><rect x="60" y="22" width="180" height="92" rx="12" fill="#fff"/><g fill="#3DA14F"><rect x="82" y="70" width="18" height="30" rx="3"/><rect x="108" y="56" width="18" height="44" rx="3"/><rect x="134" y="64" width="18" height="36" rx="3"/></g><rect x="160" y="44" width="18" height="56" rx="3" fill="#A6F26B"/><path d="M190 90 L205 70 L218 78 L228 52" fill="none" stroke="#0F3F37" stroke-width="4" stroke-linecap="round"/>',
  savoir:
    '<rect width="300" height="130" fill="#DCE9FA"/><circle cx="60" cy="10" r="60" fill="#AFCDF0"/><g fill="#fff"><circle cx="110" cy="70" r="26"/><circle cx="190" cy="70" r="26"/></g><circle cx="110" cy="64" r="9" fill="#6B4A3A"/><path d="M94 88 Q110 72 126 88" fill="#2B5B52"/><circle cx="190" cy="64" r="9" fill="#3B2A22"/><path d="M174 88 Q190 72 206 88" fill="#5B4A7A"/><path d="M138 70 H162" stroke="#0F3F37" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/>',
} as const;

export type Tone = "sap" | "amb" | "mer" | "kiv";
const tones: Tone[] = ["sap", "amb", "mer", "kiv"];

/** The same tone for the same company, everywhere. */
export function toneOf(name: string): Tone {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length]!;
}

/** « Baobab Fintech » → « BF ». */
export function initialsOf(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function Svg({ markup, box }: { markup: string; box: string }) {
  return (
    <svg
      viewBox={box}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

/** The banner of a company: its own image (resized WebP) or its pattern. */
export function Banner({
  src,
  tone,
  sizes = "(min-width: 560px) 560px, 100vw",
  priority = false,
}: {
  src?: string | null;
  tone: Tone | "oppo";
  sizes?: string;
  priority?: boolean;
}) {
  if (src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- already resized WebP (640 to 1500 px)
      <img
        src={src}
        srcSet={[640, 1000, 1500]
          .map((width) => `${src.replace(/-\d+\.webp$/, `-${width}.webp`)} ${width}w`)
          .join(", ")}
        sizes={sizes}
        alt=""
        aria-hidden
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  return <Svg markup={banners[tone]} box="0 0 300 90" />;
}

/** The logo of a company: its own image, or its initials on its tone. */
export function Logo({
  name,
  src,
  tone,
  className,
}: {
  name: string;
  src?: string | null;
  tone: Tone;
  className?: string;
}) {
  return (
    <span aria-hidden className={cx("t-lg-e", `t-${tone}`, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- already resized WebP (128 and 256 px)
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

const artOf: Record<string, keyof typeof courses> = {
  digital: "numerique",
  data: "numerique",
  finance: "numerique",
  office: "numerique",
  soft: "savoir",
  communication: "savoir",
  language: "savoir",
  sales: "entretien",
  project: "entretien",
};

/** The picture of a course: its cover, or the drawing of its family. */
export function CourseArt({ category, src }: { category: string; src?: string | null }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element -- cover chosen in the admin
    return <img src={src} alt="" aria-hidden loading="lazy" decoding="async" />;
  return <Svg markup={courses[artOf[category] ?? "cv"]} box="0 0 300 130" />;
}
