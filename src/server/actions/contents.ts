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
  restoreVersion,
  saveBanner,
  saveFaqItem,
  saveTip,
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
  // A published text: the reason is required and kept in the audit log.
  const reason = String(formData.get("reason") ?? "")
    .trim()
    .slice(0, 500);
  if (!reason) {
    redirect(`/admin/contenus?${new URLSearchParams({ groupe: group, erreur: "motif" })}`);
  }
  let n: number;
  try {
    n = await saveFaqItem(db, user.id, await getMessages(), Object.fromEntries(formData));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    redirect(`/admin/contenus?${new URLSearchParams({ groupe: group, erreur: "champs" })}`);
  }
  await audit(user.id, "content.faq.save", `${group}.q${n}`, {
    question: String(formData.get("question") ?? "").slice(0, 300),
    reason,
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
  await deleteBanner(db, id, user.id);
  await audit(user.id, "content.banner.delete", id, {});
  back({ onglet: "bannieres", ok: "supprime" });
}

const reasonOf = (formData: FormData) =>
  String(formData.get("reason") ?? "")
    .trim()
    .slice(0, 500);

/** A tip sheet « Conseils de préparation » (Admin v2, étape 8): published with a reason. */
export async function saveTipAction(formData: FormData) {
  const user = await editor();
  const current = String(formData.get("id") ?? "").slice(0, 40);
  const tab = { onglet: "conseils", ...(current ? { fiche: current } : {}) };
  const reason = reasonOf(formData);
  if (reason.length < 3)
    redirect(`/admin/contenus?${new URLSearchParams({ ...tab, erreur: "motif" })}`);
  let id: string;
  try {
    id = await saveTip(db, user.id, Object.fromEntries(formData));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    redirect(`/admin/contenus?${new URLSearchParams({ ...tab, erreur: "champs" })}`);
  }
  await audit(user.id, "content.tip.save", `tips.${id}`, {
    title: String(formData.get("title") ?? "").slice(0, 120),
    published: formData.get("published") === "on",
    reason,
  });
  back({ onglet: "conseils", fiche: id, ok: "enregistre" }, "#editeur");
}

/** Where the admin finds an item again: its tab, then the item itself. */
function placeOf(item: string): Record<string, string> {
  if (item.startsWith("tips.")) return { onglet: "conseils", fiche: item.slice("tips.".length) };
  if (item.startsWith("banner.")) return { onglet: "bannieres" };
  const match = item.match(/^(.+)\.q(\d+)$/);
  return match ? { groupe: match[1]!, question: match[2]! } : {};
}

/** « Restaurer »: a former version comes back, with a reason kept in the audit log. */
export async function restoreVersionAction(formData: FormData) {
  const user = await editor();
  const item = String(formData.get("item") ?? "").slice(0, 120);
  const reason = reasonOf(formData);
  if (reason.length < 3) back({ ...placeOf(item), erreur: "motif" }, "#versions");
  const restored = await restoreVersion(
    db,
    user.id,
    String(formData.get("version") ?? "").slice(0, 40),
    reason,
  );
  if (!restored) back({ ...placeOf(item), erreur: "champs" }, "#versions");
  // Banners are logged by their id (as « content.banner.save »), the other items by their key.
  const target = restored!.item.replace(/^banner\./, "");
  await audit(user.id, "content.restore", target, {
    version: String(formData.get("version") ?? "").slice(0, 40),
    reason,
  });
  back({ ...placeOf(restored!.item), ok: "restaure" }, "#versions");
}
