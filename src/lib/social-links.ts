import { z } from "zod";

/**
 * The networks of a person's profile (docs/profil-personne § En-tête 4): LinkedIn, Instagram, X,
 * Facebook and a website, as https addresses. Only the ones filled in are shown; the e-mail is a
 * separate choice of the person (off by default). Shared by the server and the browser.
 */
export const SOCIAL_KINDS = ["linkedin", "instagram", "x", "facebook", "website"] as const;
export type SocialKind = (typeof SOCIAL_KINDS)[number];

/** The sites each network accepts (a LinkedIn field never holds another address). */
const HOSTS: Record<Exclude<SocialKind, "website">, string[]> = {
  linkedin: ["linkedin.com"],
  instagram: ["instagram.com"],
  x: ["x.com", "twitter.com"],
  facebook: ["facebook.com", "fb.com"],
};

/** « linkedin.com/in/patrick » becomes « https://linkedin.com/in/patrick ». */
export function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function linkOf(kind: SocialKind) {
  return z
    .string()
    .trim()
    .max(300)
    .transform(normalizeLink)
    .refine((value) => {
      if (!value) return true;
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        return false;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") return false;
      if (kind === "website") return url.hostname.includes(".");
      const host = url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");
      return HOSTS[kind].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    }, "invalid");
}

/** What « Modifier le profil » sends: an empty field removes the network. */
export const socialLinksInput = z.object(
  Object.fromEntries(SOCIAL_KINDS.map((kind) => [kind, linkOf(kind).optional()])) as Record<
    SocialKind,
    z.ZodOptional<ReturnType<typeof linkOf>>
  >,
);
export type SocialLinks = Partial<Record<SocialKind, string>>;

/** The links kept in `TalentProfile.socialLinks`: only the filled-in, valid ones. */
export function cleanSocialLinks(input: z.output<typeof socialLinksInput>): SocialLinks {
  const links: SocialLinks = {};
  for (const kind of SOCIAL_KINDS) {
    const value = input[kind];
    if (value) links[kind] = value;
  }
  return links;
}

/** Reads the stored value: anything unexpected is left out, never shown. */
export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const links: SocialLinks = {};
  for (const kind of SOCIAL_KINDS) {
    const item = raw[kind];
    if (typeof item !== "string") continue;
    const parsed = linkOf(kind).safeParse(item);
    if (parsed.success && parsed.data) links[kind] = parsed.data;
  }
  return links;
}

/** « @patrick.ilunga »: letters, digits and dots, 3 to 30, never starting or ending with a dot. */
export const handleInput = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/),
  );

/** The handle drawn from the name when the person has not chosen one: « patrick.ilunga ». */
export function handleFromName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "")
      .slice(0, 30)
      .replace(/\.$/, "") || "jumanly"
  );
}
