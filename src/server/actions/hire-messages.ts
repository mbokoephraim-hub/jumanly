"use server";

import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { deleteTemplate, saveTemplate, templateSchema } from "@/server/services/message-templates";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError) redirect(fallback);
    throw error;
  }
}

// ─── The organization's templates ───────────────────────────────────────────────

export async function saveTemplateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/modeles", "manage");
  const templateId = id(formData.get("template"));
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(`/app/hire/modeles?erreur=1${templateId ? `&modele=${templateId}` : ""}`);
  await guarded(
    () => saveTemplate(db, ctx, { ...parsed.data, id: templateId || undefined }),
    "/app/hire/modeles?erreur=1",
  );
  redirect("/app/hire/modeles?ok=enregistre");
}

export async function deleteTemplateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/modeles", "manage");
  await guarded(
    () => deleteTemplate(db, ctx, id(formData.get("template"))),
    "/app/hire/modeles?erreur=1",
  );
  redirect("/app/hire/modeles?ok=supprime");
}
