"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { mailOrgNotice } from "@/server/hire-emails";
import {
  grantOrgPlan,
  grantOrgPlanSchema,
  infoRequestSchema,
  OrgAdminError,
  reactivateOrganization,
  reactivateSchema,
  requestMoreInformation,
  suspendOrganization,
  suspendSchema,
} from "@/server/services/admin-orgs";

/**
 * Organization card (Admin v2, étape 4): ask for more, suspend, reactivate. Administrators only,
 * a reason each time, recorded in the journal; the organization is told in the app and by e-mail.
 */

const PAGE = "/admin/organisations";

function backOf(formData: FormData) {
  const back = String(formData.get("back") ?? "");
  return back.startsWith(PAGE) ? back : PAGE;
}

function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;
}

/** Back to the card without the open panel. */
function cardOf(back: string) {
  const [path, query = ""] = back.split("?");
  const params = new URLSearchParams(query);
  for (const key of ["action", "ok", "erreur"]) params.delete(key);
  const text = params.toString();
  return text ? `${path}?${text}` : path!;
}

async function writer() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  if (!canWriteAdmin(admin)) redirect("/admin?erreur=lecture");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { actorId: admin.id, ip };
}

async function run(formData: FormData, done: string, work: () => Promise<unknown>) {
  const back = backOf(formData);
  try {
    await work();
  } catch (error) {
    if (error instanceof OrgAdminError) redirect(withParam(back, "erreur", error.code));
    throw error;
  }
  updateTag("jobs");
  redirect(withParam(cardOf(back), "ok", done));
}

async function tell(
  organizationId: string,
  kind: "infoRequested" | "suspended" | "reactivated",
  reason: string,
) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      memberships: {
        where:
          kind === "infoRequested" ? { role: "org_owner", status: "active" } : { status: "active" },
        select: { user: { select: { email: true, firstName: true } } },
      },
    },
  });
  for (const membership of organization?.memberships ?? []) {
    await mailOrgNotice(membership.user, { org: organization!.name, kind, reason });
  }
}

export async function requestMoreAction(formData: FormData) {
  const context = await writer();
  const input = infoRequestSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "reason"));
  await run(formData, "infoRequested", async () => {
    await requestMoreInformation(db, context, input.data);
    await tell(input.data.organizationId, "infoRequested", input.data.reason);
  });
}

export async function suspendOrganizationAction(formData: FormData) {
  const context = await writer();
  const input = suspendSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "reason"));
  await run(formData, "suspended", async () => {
    await suspendOrganization(db, context, input.data);
    await tell(input.data.organizationId, "suspended", input.data.reason);
  });
}

export async function reactivateOrganizationAction(formData: FormData) {
  const context = await writer();
  const input = reactivateSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "reason"));
  await run(formData, "reactivated", async () => {
    await reactivateOrganization(db, context, input.data);
    await tell(input.data.organizationId, "reactivated", input.data.reason);
  });
}

/** « Offrir une formule » to an organization until a date, with a reason. */
export async function grantOrgPlanAction(formData: FormData) {
  const context = await writer();
  const input = grantOrgPlanSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "reason"));
  await run(formData, "planGranted", () => grantOrgPlan(db, context, input.data));
}
