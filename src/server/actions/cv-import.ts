"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { applyImport, CV_TEXT_MAX, importCvText } from "@/server/services/cv-import";

const PATH = "/app/profil/import";

/** Step 1: read the pasted CV (valider → session → service; credits are checked in src/server/ai). */
export async function readCvAction(formData: FormData) {
  const text = z.string().trim().min(30).max(CV_TEXT_MAX).safeParse(formData.get("text"));
  const user = await requireUser(PATH);
  if (!text.success) redirect(`${PATH}?erreur=texte`);
  await importCvText(db, user.id, text.data);
  refresh();
  redirect(`${PATH}?etape=verification`);
}

const indexes = (formData: FormData, key: string) =>
  formData
    .getAll(key)
    .map(Number)
    .filter((value) => Number.isInteger(value) && value >= 0 && value < 100);

/** Step 2: only the items ticked by the talent enter the profile. */
export async function applyCvImportAction(formData: FormData) {
  const user = await requireUser(PATH);
  const added = await applyImport(db, user.id, String(formData.get("import") ?? ""), {
    experiences: indexes(formData, "experience"),
    educations: indexes(formData, "education"),
    skills: indexes(formData, "skill"),
  });
  refresh();
  if (added === null) redirect(PATH);
  redirect(`/app/profil?import=${added}`);
}

export async function cancelCvImportAction() {
  const user = await requireUser(PATH);
  await db.aiSuggestion.updateMany({
    where: { userId: user.id, feature: "cv_parse", status: "pending" },
    data: { status: "ignored" },
  });
  refresh();
  redirect("/app/profil");
}
