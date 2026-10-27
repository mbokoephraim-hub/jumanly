"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { CvFileError, readCvFile } from "@/server/services/cv-file";
import { applyImport, CV_TEXT_MAX, importCvText, parseImport } from "@/server/services/cv-import";
import { CV_FILE_TYPES, holdImportedFile } from "@/server/services/cv-original";
import { fileStorage } from "@/server/storage";

const PATH = "/app/profil/import";

/**
 * Where the import answers: its page, the « Importer un CV » window of « CV et documents » on a
 * computer (`retour=cv`, planche studio-cv § 1), or « Créer un CV » on the phone
 * (`retour=nouveau`). Only these places: never an address sent.
 */
function where(formData: FormData | undefined, params = "") {
  const from = formData?.get("retour");
  // « Créer un CV » on the phone (docs/carriere-v3, captures 13 to 15).
  if (from === "nouveau") {
    const step = params === "etape=verification" ? "etape=trouve" : `etape=import&${params}`;
    return `/app/career/cv/nouveau?${params ? step : "etape=import"}`;
  }
  const fromList = from === "cv";
  const base = fromList ? "/app/career/cv?importer=1" : PATH;
  if (!params) return base;
  return `${base}${fromList ? "&" : "?"}${params}`;
}

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
 * a Word document is read on the server; its text goes through the same reading as a pasted CV.
 * From « Nouveau CV » the file waits, to be kept in « Mes CV » if the talent chooses so.
 */
export async function readCvFileAction(formData: FormData) {
  const user = await requireUser(PATH);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(where(formData, "erreur=empty"));
  let read;
  try {
    read = await readCvFile(new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof CvFileError) redirect(where(formData, `erreur=${error.code}`));
    throw error;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pending = await importCvText(db, user.id, read.text, {
    name: file.name,
    kind: read.kind,
    pages: read.pages,
    size: file.size,
  });
  // « Nouveau CV » on the phone offers to keep the file itself (Ephraïm, 27/10): it waits there.
  if (formData.get("retour") === "nouveau")
    await holdImportedFile(fileStorage(db), user.id, pending.id, {
      contentType: CV_FILE_TYPES[read.kind],
      bytes,
    });
  refresh();
  redirect(where(formData, "etape=verification"));
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
  if (!payload) redirect(where(formData));
  const all = (group: ImportGroup) =>
    chosen.has(group) ? payload[group].map((_, index) => index) : [];
  const added = await applyImport(db, user.id, id, {
    experiences: all("experiences"),
    educations: all("educations"),
    skills: all("skills"),
  });
  refresh();
  if (added === null) redirect(where(formData));
  redirect(`/app/profil?import=${added}`);
}

export async function cancelCvImportAction(formData?: FormData) {
  const user = await requireUser(PATH);
  await db.aiSuggestion.updateMany({
    where: { userId: user.id, feature: "cv_parse", status: "pending" },
    data: { status: "ignored" },
  });
  refresh();
  redirect(formData?.get("retour") === "cv" ? "/app/career/cv" : PATH);
}
