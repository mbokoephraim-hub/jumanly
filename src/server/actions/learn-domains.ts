"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { db } from "@/server/db";
import { requireCourseEditor } from "@/server/auth/session";
import {
  createDomain,
  deleteDomain,
  domainFormSchema,
  updateDomain,
} from "@/server/services/learn-domains";

const PAGE = "/admin/formations/domaines";

async function audit(actorId: string, action: string, targetId: string) {
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType: "learning_domain",
      targetId,
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
}

function back(params: Record<string, string>, anchor = "") {
  // The catalog (Explorer, public pages) shows the domains: refreshed after each change.
  updateTag("courses");
  refresh();
  redirect(`${PAGE}?${new URLSearchParams(params)}${anchor}`);
}

/** Learn v2, étape 1: valider → session → rôle → service → journal. */
export async function createDomainAction(formData: FormData) {
  const parsed = domainFormSchema.safeParse(Object.fromEntries(formData));
  const user = await requireCourseEditor();
  if (!user) notFound();
  if (!parsed.success) back({ erreur: "nouveau" }, "#nouveau");
  const domain = await createDomain(db, parsed.data!);
  await audit(user.id, "learning_domain.create", domain.id);
  back({ ok: "created" }, `#domaine-${domain.slug}`);
}

export async function updateDomainAction(formData: FormData) {
  const id = String(formData.get("domain") ?? "").slice(0, 40);
  const parsed = domainFormSchema.safeParse(Object.fromEntries(formData));
  const user = await requireCourseEditor();
  if (!user) notFound();
  const domain = await db.learningDomain.findUnique({ where: { id }, select: { slug: true } });
  if (!domain) notFound();
  if (!parsed.success) back({ erreur: id }, `#domaine-${domain.slug}`);
  await updateDomain(db, id, parsed.data!);
  await audit(user.id, "learning_domain.update", id);
  back({ ok: "saved" }, `#domaine-${domain.slug}`);
}

/** Only an administrator deletes a domain; its courses stay published, without domain. */
export async function deleteDomainAction(formData: FormData) {
  const id = String(formData.get("domain") ?? "").slice(0, 40);
  const user = await requireCourseEditor();
  if (!user || user.platformRole !== "platform_admin") notFound();
  if (!(await db.learningDomain.findUnique({ where: { id }, select: { id: true } }))) notFound();
  await deleteDomain(db, id);
  await audit(user.id, "learning_domain.delete", id);
  back({ ok: "deleted" });
}
