/**
 * Editable contents (partie 07, `/admin/contenus`): FAQ questions and banners.
 *
 * Texts come from textes/textes-application.md; a `ContentBlock` row replaces one of them, or adds a
 * question, without a new deployment. Deleting the row brings back the original text.
 * - FAQ: keys `<group>.q<n>` and `<group>.a<n>`. An empty question hides that question.
 * - Banners: key `banner.<id>`, value in JSON (text, audience, dates, style).
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

export const LOCALE = "fr";

/** FAQ groups: the /faq themes, the short FAQ of the home page and the pricing FAQ. */
export const FAQ_GROUPS = [
  "faq.general",
  "faq.talents",
  "faq.learn",
  "faq.ai",
  "faq.privacy",
  "faq.billing",
  "faq.recruiters",
  "faq.partners",
  "home.faq",
  "pricing.faq",
] as const;
export type FaqGroup = (typeof FAQ_GROUPS)[number];

export type Overrides = Record<string, string>;

export class ContentError extends Error {
  constructor(readonly code: "invalid" | "notFound") {
    super(code);
    this.name = "ContentError";
  }
}

export async function listOverrides(db: PrismaClient, locale = LOCALE): Promise<Overrides> {
  const rows = await db.contentBlock.findMany({
    where: { locale },
    select: { key: true, value: true },
  });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export type FaqItem = {
  n: number;
  question: string;
  answer: string;
  /** Changed in the admin (or added there). */
  edited: boolean;
  /** Added in the admin: no original text. */
  added: boolean;
  hidden: boolean;
};

function messageAt(messages: unknown, key: string): string | null {
  let node: unknown = messages;
  for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === "string" ? node : null;
}

function numbersIn(keys: string[], prefix: string) {
  return keys
    .map((key) => key.match(new RegExp(`^${prefix.replaceAll(".", "\\.")}\\.q(\\d+)$`))?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
}

/** The questions of a group, original texts replaced by the admin's, in number order. */
export function faqItems(
  messages: unknown,
  overrides: Overrides,
  group: FaqGroup,
  { withHidden = false } = {},
): FaqItem[] {
  const node = group
    .split(".")
    .reduce<unknown>((at, part) => (at as Record<string, unknown>)?.[part], messages);
  const defaults =
    node && typeof node === "object" ? Object.keys(node).map((key) => `${group}.${key}`) : [];
  const numbers = [
    ...new Set([...numbersIn(defaults, group), ...numbersIn(Object.keys(overrides), group)]),
  ];
  return numbers
    .sort((a, b) => a - b)
    .map((n) => {
      const q = `${group}.q${n}`;
      const a = `${group}.a${n}`;
      const original = { question: messageAt(messages, q), answer: messageAt(messages, a) };
      return {
        n,
        // A hidden question keeps its original wording in the admin, so it can be found again.
        question: (overrides[q] || original.question) ?? overrides[q] ?? "",
        answer: overrides[a] ?? original.answer ?? "",
        edited: q in overrides || a in overrides,
        added: original.question === null,
        hidden: overrides[q] === "",
      };
    })
    .filter((item) => withHidden || (!item.hidden && item.question !== "" && item.answer !== ""));
}

export const faqSchema = z.object({
  group: z.enum(FAQ_GROUPS),
  n: z.coerce.number().int().min(1).max(999).optional(),
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(3000),
});

async function put(db: PrismaClient, actorId: string, key: string, value: string) {
  await db.contentBlock.upsert({
    where: { key_locale: { key, locale: LOCALE } },
    update: { value, updatedById: actorId },
    create: { key, locale: LOCALE, value, updatedById: actorId },
  });
}

/** Saves a question (a new one when `n` is missing). Returns its number. */
export async function saveFaqItem(
  db: PrismaClient,
  actorId: string,
  messages: unknown,
  raw: Record<string, unknown>,
): Promise<number> {
  const parsed = faqSchema.safeParse({ ...raw, n: raw.n || undefined });
  if (!parsed.success) throw new ContentError("invalid");
  const { group, question, answer } = parsed.data;
  let n = parsed.data.n;
  if (n === undefined) {
    const items = faqItems(messages, await listOverrides(db), group, { withHidden: true });
    n = Math.max(0, ...items.map((item) => item.n)) + 1;
  }
  await put(db, actorId, `${group}.q${n}`, question);
  await put(db, actorId, `${group}.a${n}`, answer);
  return n;
}

/** Hides a question; restoring an original one (or deleting an added one) removes the rows. */
export async function setFaqItemHidden(
  db: PrismaClient,
  actorId: string,
  group: FaqGroup,
  n: number,
  hidden: boolean,
) {
  const keys = [`${group}.q${n}`, `${group}.a${n}`];
  if (hidden) await put(db, actorId, keys[0]!, "");
  else await db.contentBlock.deleteMany({ where: { key: { in: keys }, locale: LOCALE } });
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export const bannerAudiences = ["all", "talents", "recruiters", "partners"] as const;
export const bannerStyles = ["info", "warning"] as const;
export type BannerAudience = (typeof bannerAudiences)[number];

const day = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

export const bannerSchema = z
  .object({
    text: z.string().trim().min(3).max(300),
    audience: z.enum(bannerAudiences),
    style: z.enum(bannerStyles).default("info"),
    start: day.default(""),
    end: day.default(""),
  })
  .refine((banner) => !banner.start || !banner.end || banner.start <= banner.end, {
    path: ["end"],
  });
export type Banner = z.infer<typeof bannerSchema> & { id: string };

export function listBanners(overrides: Overrides): Banner[] {
  return Object.entries(overrides)
    .filter(([key]) => key.startsWith("banner."))
    .flatMap(([key, value]) => {
      try {
        const parsed = bannerSchema.safeParse(JSON.parse(value));
        return parsed.success ? [{ ...parsed.data, id: key.slice("banner.".length) }] : [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Banners shown now to a public. Dates are whole days in UTC: a banner shows from the start of its
 * first day to the end of its last day. The public site only shows banners meant for everyone.
 */
export function activeBanners(
  overrides: Overrides,
  audience: BannerAudience,
  now = new Date(),
): Banner[] {
  const today = now.toISOString().slice(0, 10);
  return listBanners(overrides).filter(
    (banner) =>
      (banner.audience === "all" || banner.audience === audience) &&
      (!banner.start || banner.start <= today) &&
      (!banner.end || today <= banner.end),
  );
}

export async function saveBanner(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
): Promise<string> {
  const parsed = bannerSchema.safeParse(raw);
  if (!parsed.success) throw new ContentError("invalid");
  const id = typeof raw.id === "string" && /^[a-z0-9]{6,32}$/.test(raw.id) ? raw.id : newBannerId();
  await put(db, actorId, `banner.${id}`, JSON.stringify(parsed.data));
  return id;
}

export async function deleteBanner(db: PrismaClient, id: string) {
  await db.contentBlock.deleteMany({ where: { key: `banner.${id}`, locale: LOCALE } });
}

function newBannerId() {
  // Sortable by creation time, then random.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
