"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { CvFileError, readCvFile } from "@/server/services/cv-file";
import { applyImport, CV_TEXT_MAX, importCvText, parseImport } from "@/server/services/cv-import";

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

/**
 * Step 1 from a file (planche talent-4 § 6, « Choisir un fichier », « Depuis LinkedIn »): a PDF or
 * a Word document is read on the server and never kept; its text goes through the same reading
 * as a pasted CV.
 */
export async function readCvFileAction(formData: FormData) {
  const user = await requireUser(PATH);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(`${PATH}?erreur=empty`);
  let read;
  try {
    read = await readCvFile(new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof CvFileError) redirect(`${PATH}?erreur=${error.code}`);
    throw error;
  }
  await importCvText(db, user.id, read.text, {
    name: file.name,
    kind: read.kind,
    pages: read.pages,
    size: file.size,
  });
  refresh();
  redirect(`${PATH}?etape=verification`);
}

type ImportGroup = "experiences" | "educations" | "skills";

/**
 * Step 2 (« Lu dans votre fichier · à vérifier »): only the groups the talent left on enter the
 * profile; nothing is added without this tap.
 */
export async function applyCvImportAction(formData: FormData) {
  const user = await requireUser(PATH);
  const id = String(formData.get("import") ?? "").slice(0, 60);
  const chosen = new Set(formData.getAll("groupe").map(String));
  const pending = await db.aiSuggestion.findFirst({
    where: { id, userId: user.id, feature: "cv_parse", status: "pending" },
  });
  const payload = pending ? parseImport(pending.payload) : null;
  if (!payload) redirect(PATH);
  const all = (group: ImportGroup) =>
    chosen.has(group) ? payload[group].map((_, index) => index) : [];
  const added = await applyImport(db, user.id, id, {
    experiences: all("experiences"),
    educations: all("educations"),
    skills: all("skills"),
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
  redirect(PATH);
}
