/**
 * Editable contents (partie 07, `/admin/contenus`): FAQ questions and banners.
 *
 * Texts come from textes/textes-application.md; a `ContentBlock` row replaces one of them, or adds a
 * question, without a new deployment. Deleting the row brings back the original text.
 * - FAQ: keys `<group>.q<n>` and `<group>.a<n>`. An empty question hides that question.
 * - Banners: key `banner.<id>`, value in JSON (text, audience, dates, style).
 * - Tip sheets « Conseils de préparation » (Admin v2, étape 8): key `tips.<id>`, value in JSON
 *   (title, text, reading time, published). Free for everyone, no AI (partie 05).
 *
 * Every change first keeps the former values in `ContentVersion`, so « Restaurer » can put them
 * back (Admin v2, étape 8).
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

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

// ─── Versions ────────────────────────────────────────────────────────────────

/** The reason given with a change (the actions ask for it), kept with the version. */
function reasonOf(raw: Record<string, unknown>) {
  return typeof raw.reason === "string" ? raw.reason.trim().slice(0, 500) || null : null;
}

/** Keeps the current values of an item's keys (null: no row, the original text applies). */
async function keepVersion(
  db: PrismaClient,
  actorId: string | null,
  item: string,
  keys: string[],
  action: string,
  reason: string | null,
) {
  const rows = await db.contentBlock.findMany({
    where: { key: { in: keys }, locale: LOCALE },
    select: { key: true, value: true },
  });
  const previous = Object.fromEntries(
    keys.map((key) => [key, rows.find((row) => row.key === key)?.value ?? null]),
  );
  await db.contentVersion.create({
    data: { item, locale: LOCALE, previous, action, reason, createdById: actorId },
  });
}

export type ContentVersion = {
  id: string;
  action: string;
  reason: string | null;
  createdAt: Date;
  actorName: string | null;
  previous: Record<string, string | null>;
};

/** The former versions of an item, newest first, with who replaced them. */
export async function contentVersions(
  db: PrismaClient,
  item: string,
  take = 10,
): Promise<ContentVersion[]> {
  const rows = await db.contentVersion.findMany({
    where: { item, locale: LOCALE },
    orderBy: { createdAt: "desc" },
    take,
  });
  const ids = [...new Set(rows.flatMap((row) => (row.createdById ? [row.createdById] : [])))];
  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    reason: row.reason,
    createdAt: row.createdAt,
    actorName: users.find((user) => user.id === row.createdById)?.name ?? null,
    previous: row.previous as Record<string, string | null>,
  }));
}

/**
 * Puts a former version back. The current values are kept first, so a restore can itself be
 * undone. Returns the item, or null when the version does not exist.
 */
export async function restoreVersion(
  db: PrismaClient,
  actorId: string,
  versionId: string,
  reason: string,
) {
  const version = await db.contentVersion.findUnique({ where: { id: versionId } });
  if (!version || version.locale !== LOCALE) return null;
  const previous = version.previous as Record<string, string | null>;
  const keys = Object.keys(previous);
  await keepVersion(db, actorId, version.item, keys, "content.restore", reason);
  await db.$transaction(
    keys.map((key): Prisma.PrismaPromise<unknown> => {
      const value = previous[key];
      return value === null || value === undefined
        ? db.contentBlock.deleteMany({ where: { key, locale: LOCALE } })
        : db.contentBlock.upsert({
            where: { key_locale: { key, locale: LOCALE } },
            update: { value, updatedById: actorId },
            create: { key, locale: LOCALE, value, updatedById: actorId },
          });
    }),
  );
  return { item: version.item, previous };
}

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
  const keys = [`${group}.q${n}`, `${group}.a${n}`];
  await keepVersion(db, actorId, keys[0]!, keys, "content.faq.save", reasonOf(raw));
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
  await keepVersion(
    db,
    actorId,
    keys[0]!,
    keys,
    hidden ? "content.faq.hide" : "content.faq.reset",
    null,
  );
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
  const key = `banner.${id}`;
  await keepVersion(db, actorId, key, [key], "content.banner.save", reasonOf(raw));
  await put(db, actorId, `banner.${id}`, JSON.stringify(parsed.data));
  return id;
}

export async function deleteBanner(db: PrismaClient, id: string, actorId: string | null = null) {
  const key = `banner.${id}`;
  await keepVersion(db, actorId, key, [key], "content.banner.delete", null);
  await db.contentBlock.deleteMany({ where: { key: `banner.${id}`, locale: LOCALE } });
}

// ─── Tip sheets « Conseils de préparation » ──────────────────────────────────

/** The six topics planned by textes/ (`career.tips.*`); more sheets can be added in the admin. */
export const TIP_TOPICS = ["cv", "letter", "interview", "salary", "firstJob", "network"] as const;

export const tipSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20).max(8000),
  minutes: z.coerce.number().int().min(1).max(60),
  published: z
    .union([z.literal("on"), z.literal("1"), z.literal(""), z.boolean()])
    .default("")
    .transform((value) => value === true || value === "on" || value === "1"),
});

export type Tip = {
  id: string;
  title: string;
  body: string;
  minutes: number;
  published: boolean;
  /** Written in the admin (a topic of textes/ without a sheet yet has no text). */
  saved: boolean;
};

function parseTip(id: string, value: string): Tip | null {
  try {
    const parsed = tipSchema.safeParse(JSON.parse(value));
    return parsed.success ? { id, ...parsed.data, saved: true } : null;
  } catch {
    return null;
  }
}

/** Every sheet: the planned topics first (in their order), then the added ones. */
export function listTips(messages: unknown, overrides: Overrides): Tip[] {
  const planned = TIP_TOPICS.map((id): Tip => {
    const saved = overrides[`tips.${id}`];
    return (
      (saved !== undefined ? parseTip(id, saved) : null) ?? {
        id,
        title: messageAt(messages, `career.tips.${id}`) ?? id,
        body: "",
        minutes: 3,
        published: false,
        saved: false,
      }
    );
  });
  const added = Object.entries(overrides)
    .filter(([key]) => key.startsWith("tips."))
    .map(([key, value]) => [key.slice("tips.".length), value] as const)
    .filter(([id]) => !(TIP_TOPICS as readonly string[]).includes(id))
    .flatMap(([id, value]) => parseTip(id, value) ?? [])
    .sort((a, b) => a.id.localeCompare(b.id));
  return [...planned, ...added];
}

/** The sheets shown to talents. */
export function publishedTips(messages: unknown, overrides: Overrides) {
  return listTips(messages, overrides).filter((tip) => tip.published && tip.body !== "");
}

/** Saves a sheet (a new one without a known `id`). Returns its id. */
export async function saveTip(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
): Promise<string> {
  const parsed = tipSchema.safeParse(raw);
  if (!parsed.success) throw new ContentError("invalid");
  const known =
    typeof raw.id === "string" &&
    ((TIP_TOPICS as readonly string[]).includes(raw.id) || /^[a-z0-9]{6,32}$/.test(raw.id));
  const id = known ? (raw.id as string) : newBannerId();
  const key = `tips.${id}`;
  await keepVersion(db, actorId, key, [key], "content.tip.save", reasonOf(raw));
  await put(db, actorId, key, JSON.stringify(parsed.data));
  return id;
}

function newBannerId() {
  // Sortable by creation time, then random.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
