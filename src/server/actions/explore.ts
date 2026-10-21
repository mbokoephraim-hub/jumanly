"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { onApplicationCreated } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { applyToJob } from "@/server/services/applications";
import { ConnectionError, requestConnection } from "@/server/services/connections";
import { createReport } from "@/server/services/moderation";
import { EXPLORE_SCOPES, exploreSearch, toggleFollowCompany } from "@/server/services/explore";
import {
  explorerWords,
  type CompanyView,
  type OfferView,
  type PersonView,
} from "@/components/phone/explorer/data";

/**
 * The gestures of Explorer (Modèle B, lot B4). Order of CLAUDE.md: validate → session → service.
 * Each one answers with a small result the screen turns into a toast; nothing throws to the page.
 */
export type ExploreResult<T> = { ok: true; value: T } | { ok: false; error: string };

const PAGE = "/app/jobs";
const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);
const slugSchema = z.string().trim().min(1).max(200);

/** « Se connecter » from Explorer, a company's members or a person's page. */
export async function connectAction(
  personId: string,
): Promise<ExploreResult<"sent" | "accepted" | "already">> {
  const parsed = idSchema.safeParse(personId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const value = await requestConnection(db, user.id, parsed.data);
    refresh();
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ConnectionError) return { ok: false, error: error.code };
    void reportError(error, { message: "Explorer · connexion" });
    return { ok: false, error: "failed" };
  }
}

/** « Suivre » a company: its posts come into « Abonnements » of the Fil. */
export async function followCompanyAction(slug: string): Promise<ExploreResult<boolean>> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const value = await toggleFollowCompany(db, user.id, parsed.data);
    if (value === null) return { ok: false, error: "notFound" };
    refresh();
    return { ok: true, value };
  } catch (error) {
    void reportError(error, { message: "Explorer · suivre" });
    return { ok: false, error: "failed" };
  }
}

const searchSchema = z.object({
  query: z.string().max(80),
  scope: z.enum(EXPLORE_SCOPES),
});

export type ExploreFound = {
  offers: OfferView[];
  companies: CompanyView[];
  people: PersonView[];
  cities: { city: string; offers: number }[];
};

/** The results of the search of Explorer, from the first letter. */
export async function exploreSearchAction(
  query: string,
  scope: string,
): Promise<ExploreResult<ExploreFound>> {
  const parsed = searchSchema.safeParse({ query, scope });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  const now = new Date();
  try {
    const [found, words] = await Promise.all([
      exploreSearch(db, user.id, parsed.data.query, parsed.data.scope, now),
      explorerWords(now),
    ]);
    return {
      ok: true,
      value: {
        offers: found.offers.map(words.offer),
        companies: found.companies.map(words.company),
        people: found.people.map(words.person),
        cities: found.cities,
      },
    };
  } catch (error) {
    void reportError(error, { message: "Explorer · recherche" });
    return { ok: false, error: "failed" };
  }
}

const applySchema = z.object({
  job: slugSchema,
  cv: z.string().max(60).default(""),
  note: z.string().max(5000).default(""),
});

/**
 * « Envoyer ma candidature » from the sheet of an offer. Free like every application: no
 * entitlement, no quota, no plan is checked here (golden rule n° 1).
 */
export async function applyFromSheetAction(input: {
  job: string;
  cv: string;
  note: string;
}): Promise<ExploreResult<"applied" | "already">> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`/app/jobs/${parsed.data.job}`);
  try {
    const result = await applyToJob(db, {
      userId: user.id,
      jobSlug: parsed.data.job,
      cvDocumentId: parsed.data.cv || null,
      coverLetter: parsed.data.note,
      attachments: [],
      answers: {},
    });
    if (result.status === "applied") {
      await onApplicationCreated(result.applicationId).catch((error) => reportError(error));
      refresh();
      return { ok: true, value: "applied" };
    }
    if (result.status === "already") return { ok: true, value: "already" };
    return { ok: false, error: result.status };
  } catch (error) {
    void reportError(error, { message: "Explorer · candidature" });
    return { ok: false, error: "failed" };
  }
}

const reportReasonSchema = z.enum([
  "harassment",
  "impersonation",
  "spam",
  "inappropriate",
  "other",
]);

/**
 * « Signaler le profil » of a person I am (or was) in touch with: the report reaches the
 * moderation queue, the person is never told who reported.
 */
export async function reportPersonAction(
  personId: string,
  reason: string,
): Promise<ExploreResult<"created" | "already">> {
  const id = idSchema.safeParse(personId);
  const why = reportReasonSchema.safeParse(reason);
  if (!id.success || !why.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  const profile = await db.talentProfile.findUnique({
    where: { userId: id.data },
    select: { id: true },
  });
  if (!profile) return { ok: false, error: "notFound" };
  const result = await createReport(db, user.id, {
    targetType: "profile",
    targetId: profile.id,
    reason: why.data,
  });
  if (result === "notFound") return { ok: false, error: "notFound" };
  return { ok: true, value: result };
}
