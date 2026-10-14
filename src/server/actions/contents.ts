"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { getMessages } from "next-intl/server";
import type { Prisma } from "@/generated/prisma/client";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  ContentError,
  deleteBanner,
  FAQ_GROUPS,
  type FaqGroup,
  saveBanner,
  saveFaqItem,
  setFaqItemHidden,
} from "@/server/services/contents";

/** /admin/contenus: content editors and administrators, each change in the audit log. */
async function editor() {
  const user = await requireCourseEditor();
  if (!user) notFound();
  return user;
}

async function audit(
  actorId: string,
  action: string,
  targetId: string,
  metadata: Prisma.InputJsonValue,
) {
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType: "content",
      targetId,
      metadata,
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
}

function back(params: Record<string, string>, anchor = ""): never {
  // Public pages read the contents from the cache: they show the change at once.
  updateTag("contents");
  refresh();
  redirect(`/admin/contenus?${new URLSearchParams(params)}${anchor}`);
}

const groupOf = (formData: FormData): FaqGroup => {
  const group = String(formData.get("group") ?? "");
  return (FAQ_GROUPS as readonly string[]).includes(group) ? (group as FaqGroup) : FAQ_GROUPS[0];
};

export async function saveFaqItemAction(formData: FormData) {
  const user = await editor();
  const group = groupOf(formData);
  let n: number;
  try {
    n = await saveFaqItem(db, user.id, await getMessages(), Object.fromEntries(formData));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    redirect(`/admin/contenus?${new URLSearchParams({ groupe: group, erreur: "champs" })}`);
  }
  await audit(user.id, "content.faq.save", `${group}.q${n}`, {
    question: String(formData.get("question") ?? "").slice(0, 300),
  });
  back({ groupe: group, ok: "enregistre" }, `#question-${n}`);
}

export async function setFaqItemHiddenAction(formData: FormData) {
  const user = await editor();
  const group = groupOf(formData);
  const n = Number(formData.get("n"));
  if (!Number.isInteger(n) || n < 1) back({ groupe: group });
  const hidden = formData.get("hidden") === "1";
  await setFaqItemHidden(db, user.id, group, n, hidden);
  await audit(user.id, hidden ? "content.faq.hide" : "content.faq.reset", `${group}.q${n}`, {});
  back({ groupe: group, ok: "enregistre" }, `#question-${n}`);
}

export async function saveBannerAction(formData: FormData) {
  const user = await editor();
  let id: string;
  try {
    id = await saveBanner(db, user.id, Object.fromEntries(formData));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    redirect("/admin/contenus?onglet=bannieres&erreur=champs");
  }
  await audit(user.id, "content.banner.save", id, {
    text: String(formData.get("text") ?? "").slice(0, 300),
    audience: String(formData.get("audience") ?? ""),
  });
  back({ onglet: "bannieres", ok: "enregistre" }, `#banniere-${id}`);
}

export async function deleteBannerAction(formData: FormData) {
  const user = await editor();
  const id = String(formData.get("id") ?? "").slice(0, 40);
  await deleteBanner(db, id);
  await audit(user.id, "content.banner.delete", id, {});
  back({ onglet: "bannieres", ok: "supprime" });
}
