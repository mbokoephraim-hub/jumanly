"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { setActiveSpace } from "@/server/hire-context";
import {
  createTesterOrganization,
  isTester,
  setTesterPlan,
  testerOrganizations,
  TesterError,
} from "@/server/services/tester";

/**
 * « Mode testeur » (docs/decisions/2026-10-16-compte-passe-partout.md). Order: validate → session →
 * tester (TESTER_EMAILS) → service. Anyone else gets a 404, so the panel is not revealed.
 */

const PAGE = "/app/testeur";

async function tester() {
  const user = await requireUser(PAGE);
  if (!isTester(user)) notFound();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { ...user, ip };
}

const planSchema = z.object({
  plan: z.string().min(1).max(60),
  side: z.enum(["talent", "organization"]),
});

export async function chooseTesterPlan(formData: FormData) {
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${PAGE}?erreur=1`);
  const actor = await tester();
  const { organization } = await testerOrganizations(db, actor.id);
  const subject =
    parsed.data.side === "talent"
      ? { type: "user" as const, id: actor.id }
      : organization
        ? { type: "organization" as const, id: organization.id }
        : null;
  if (!subject) redirect(`${PAGE}?erreur=1`);
  try {
    await setTesterPlan(db, actor, subject, parsed.data.plan);
  } catch (error) {
    if (error instanceof TesterError) redirect(`${PAGE}?erreur=1`);
    throw error;
  }
  // The shell shows the plan name: it must render again, not only the page.
  refresh();
  redirect(`${PAGE}?ok=${encodeURIComponent(parsed.data.plan)}#${parsed.data.side}`);
}

const orgSchema = z.object({ kind: z.enum(["company", "partner"]) });

export async function createTesterSpace(formData: FormData) {
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${PAGE}?erreur=1`);
  const actor = await tester();
  const t = await getTranslations("tester");
  const name = parsed.data.kind === "company" ? t("org.defaultName") : t("partner.defaultName");
  await createTesterOrganization(db, actor, parsed.data.kind, name);
  refresh();
  redirect(
    `${PAGE}?cree=${parsed.data.kind}#${parsed.data.kind === "company" ? "organization" : "partner"}`,
  );
}

/** Opens the test organization or institution space (same as the space switcher). */
export async function openTesterSpace(formData: FormData) {
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(PAGE);
  const actor = await tester();
  const { organization, partner } = await testerOrganizations(db, actor.id);
  const target = parsed.data.kind === "company" ? organization : partner;
  if (!target) redirect(PAGE);
  await setActiveSpace(target.id);
  redirect(parsed.data.kind === "company" ? "/app/hire" : "/app/partenaire");
}

/** Back to the personal space (talent side). */
export async function openPersonalSpace() {
  await tester();
  await setActiveSpace("personal");
  redirect("/app");
}
