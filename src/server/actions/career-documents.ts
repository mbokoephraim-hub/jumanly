"use server";

/**
 * Letters, proofreading, LinkedIn and the CV adapted to a job (E10). Order of partie 03:
 * validate → session → entitlement and credits (in `runAi`) → service.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PROFILE_COLORS } from "@/lib/profile-colors";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { saveApplicationDraft } from "@/server/services/application-draft";
import { parseCv } from "@/server/services/cv";
import { isCoverLetter, saveLetterDesign } from "@/server/services/letter-design";
import {
  decideCorrections,
  deleteDocument,
  generateDocument,
  generateLinkedin,
  generateSchema,
  getDocument,
  parseDocument,
  PROOFREAD_MAX,
  proofread,
  saveDocument,
  saveOwnLetter,
  saveSchema,
  tailorCv,
  tailorCvToText,
  tailorKeywords,
  TAILOR_TEXT_MAX,
  type DocumentType,
  type Facts,
  type TemplateValues,
} from "@/server/services/career-documents";

const DOCUMENTS = "/app/career/documents";
/** « Lettres » of « CV et documents » (planche talent-4 § 6): where letters are listed and made. */
const LETTERS = "/app/career/cv?vue=lettres";
/** On a phone, « Nouvelle lettre » has its own page (Carrière › Mes documents, 29/10/2026). */
const lettersOf = (formData: FormData) =>
  formData.get("retour") === "telephone" ? "/app/career/lettres/nouvelle?de=telephone" : LETTERS;
const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

/** The documents by rules, in the texts' words (used when the model is not available). */
async function documentTemplate() {
  const t = await getTranslations("career.documents.template");
  return (type: DocumentType, v: TemplateValues) => {
    const paragraphs: string[] = [];
    const add = (condition: unknown, text: () => string) => {
      if (condition) paragraphs.push(text());
    };
    const points = () => t("points", { points: v.points });
    if (type === "letter") {
      add(true, () => t("greeting.formal"));
      add(true, () =>
        v.company
          ? t("letter.introCompany", { jobTitle: v.jobTitle, company: v.company })
          : t("letter.intro", { jobTitle: v.jobTitle }),
      );
      add(v.lastRole, () => t("letter.experience", { lastRole: v.lastRole }));
      add(v.skills, () => t("letter.skills", { skills: v.skills }));
      add(v.points, points);
      add(true, () => t("letter.closing"));
      add(v.name, () => v.name);
    } else if (type === "bio") {
      add(v.name && v.headline, () => t("bio.intro", { name: v.name, headline: v.headline }));
      add(v.lastRole, () => t("bio.experience", { lastRole: v.lastRole }));
      add(v.skills, () => t("bio.skills", { skills: v.skills }));
      add(v.points, () => v.points);
    } else if (type === "email") {
      add(true, () => t("greeting.simple"));
      add(true, () => t("email.intro", { jobTitle: v.jobTitle }));
      add(v.skills, () => t("email.skills", { skills: v.skills }));
      add(v.points, points);
      add(true, () => t("closing"));
      add(v.name, () => v.name);
    } else {
      add(true, () => t("greeting.simple"));
      add(true, () => t("thankYou.body", { jobTitle: v.jobTitle }));
      add(v.points, points);
      add(true, () => t("closing"));
      add(v.name, () => v.name);
    }
    // Without a job title, « Lettre · » loses its dangling separator.
    const title = t(`title.${type}`, { jobTitle: v.jobTitle }).replace(/\s*·\s*$/, "");
    return { title, text: paragraphs.join("\n\n") };
  };
}

export async function generateDocumentAction(formData: FormData) {
  const letters = lettersOf(formData);
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${letters}&erreur=input`);
  const user = await requireUser(DOCUMENTS);
  const result = await generateDocument(db, user.id, parsed.data, await documentTemplate());
  if (!result.ok) redirect(`${letters}&ia=${result.code}`);
  redirect(`${DOCUMENTS}/${result.id}?ok=cree`);
}

const proofreadSchema = z.object({
  title: z.string().trim().max(120).default(""),
  text: z.string().trim().min(1).max(PROOFREAD_MAX),
});

export async function proofreadAction(formData: FormData) {
  const letters = lettersOf(formData);
  const parsed = proofreadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${letters}&erreur=input`);
  const user = await requireUser(DOCUMENTS);
  const t = await getTranslations("career.documents.type");
  const result = await proofread(db, user.id, {
    title: parsed.data.title || t("proofread"),
    text: parsed.data.text,
  });
  if (!result.ok) redirect(`${letters}&ia=${result.code}`);
  redirect(`${DOCUMENTS}/${result.id}`);
}

/** « Utiliser cette lettre » in « Écrire et faire relire » (phone): kept without Orbi, no credit. */
export async function saveOwnLetterAction(formData: FormData) {
  const letters = lettersOf(formData);
  const parsed = proofreadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${letters}&erreur=input`);
  const user = await requireUser(DOCUMENTS);
  const t = await getTranslations("career.documents.type");
  const letter = await saveOwnLetter(db, user.id, {
    title: parsed.data.title || t("letter"),
    text: parsed.data.text,
  });
  refresh();
  redirect(`${DOCUMENTS}/${letter.id}?ok=retenue`);
}

export async function saveDocumentAction(formData: FormData) {
  const documentId = id(formData.get("id"));
  const user = await requireUser(`${DOCUMENTS}/${documentId}`);
  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${DOCUMENTS}/${documentId}?erreur=input`);
  const saved = await saveDocument(db, user.id, documentId, parsed.data);
  refresh();
  // « Retenir cette lettre » on a phone: the text is kept, a message leads to the next step,
  // the visual template (Ephraïm, 31/10/2026). Another text: « Utiliser », saved as it is.
  if (formData.get("fini") === "1")
    redirect(
      `${DOCUMENTS}/${documentId}?ok=${isCoverLetter(saved && parseDocument(saved.content)) ? "retenue" : "utilisee"}`,
    );
  redirect(`${DOCUMENTS}/${documentId}?ok=enregistre`);
}

/** « Relire encore » on a phone: Orbi reads the letter as it stands now, in the same document. */
export async function proofreadAgainAction(formData: FormData) {
  const documentId = id(formData.get("id"));
  const back = `${DOCUMENTS}/${documentId}`;
  const user = await requireUser(back);
  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.text.trim()) redirect(`${back}?erreur=input`);
  if (!(await getDocument(db, user.id, documentId))) redirect(LETTERS);
  const result = await proofread(db, user.id, {
    title: parsed.data.title,
    text: parsed.data.text,
    documentId,
  });
  refresh();
  redirect(result.ok ? `${back}?ok=relu` : `${back}?ia=${result.code}`);
}

/** « Valider le modèle »: the template (checked against the plan), colour and photo, then the preview. */
export async function chooseLetterDesignAction(formData: FormData) {
  const documentId = id(formData.get("id"));
  const back = `${DOCUMENTS}/${documentId}/modele`;
  const user = await requireUser(back);
  const result = await saveLetterDesign(db, user.id, documentId, {
    template: formData.get("template"),
    color: formData.get("color"),
    photo: formData.get("photo"),
  });
  if (result === "notFound") redirect(LETTERS);
  if (result === "locked") redirect(`${back}?erreur=locked`);
  if (result === "invalid") redirect(`${back}?erreur=input`);
  refresh();
  redirect(`${DOCUMENTS}/${documentId}/apercu`);
}

export async function applyCorrectionsAction(formData: FormData) {
  const documentId = id(formData.get("id"));
  const user = await requireUser(`${DOCUMENTS}/${documentId}`);
  const chosen = formData.getAll("correction").map((value) => id(value));
  await decideCorrections(db, user.id, documentId, chosen);
  refresh();
  redirect(`${DOCUMENTS}/${documentId}?ok=enregistre`);
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser(DOCUMENTS);
  await deleteDocument(db, user.id, id(formData.get("id")));
  redirect(`${LETTERS}&ok=supprime`);
}

export async function generateLinkedinAction() {
  const user = await requireUser("/app/career/linkedin");
  const t = await getTranslations("career.linkedin.template");
  const result = await generateLinkedin(db, user.id, (facts: Facts) =>
    t("about", {
      headline: facts.headline || facts.targetJob,
      skills: facts.skills.slice(0, 5).join(", "),
      lastRole: facts.experiences[0]
        ? [facts.experiences[0].title, facts.experiences[0].company].join(", ")
        : "",
    }),
  );
  refresh();
  redirect(`/app/career/linkedin${result.ok ? "" : `?ia=${result.code}`}`);
}

/** Where a new adapted copy opens: on its changes to review, or on the editor when there are none. */
function openCopy(result: { id: string; jobTitle: string; suggestions: number }): never {
  const params = new URLSearchParams({ adapte: result.jobTitle });
  if (result.suggestions > 0) params.set("vue", "ameliorer");
  redirect(`/app/career/cv/${result.id}?${params.toString()}`);
}

/** « Adapter à une offre » (`career.cv.tailor`, checked in `runAi`): a copy, the CV stays. */
export async function tailorCvAction(formData: FormData) {
  const cvId = id(formData.get("cvId"));
  const user = await requireUser(`/app/career/cv/${cvId}`);
  const jobId = id(formData.get("jobId"));
  // On a computer the panel « Adapter à une offre » stays open on a refusal (planche studio-cv § 4).
  const panel = formData.get("retour") === "offre" ? "&adapter=offre" : "";
  if (!jobId) redirect(`/app/career/cv/${cvId}?adaptation=input${panel}`);
  const t = await getTranslations("career.cv.tailor");
  const result = await tailorCv(db, user.id, {
    cvId,
    jobId,
    title: (jobTitle) => t("name", { jobTitle }),
  });
  if (!result.ok) redirect(`/app/career/cv/${cvId}?adaptation=${result.code}${panel}`);
  openCopy(result);
}

const tailorTextSchema = z.object({
  cvId: z.string().min(1).max(60),
  text: z.string().trim().min(30).max(TAILOR_TEXT_MAX),
});

/**
 * « Adapter à un texte » (`career.cv.tailor`): the pasted text is data, never an instruction; the
 * copy waits for the talent's checks, change by change.
 */
export async function tailorCvTextAction(formData: FormData) {
  const cvId = id(formData.get("cvId"));
  const user = await requireUser(`/app/career/cv/${cvId}`);
  const parsed = tailorTextSchema.safeParse({ cvId, text: formData.get("text") });
  // On a computer the panel « Adapter à un texte » stays open on a refusal (planche studio-cv § 5).
  const panel = formData.get("retour") === "texte" ? "&adapter=texte" : "";
  if (!parsed.success) redirect(`/app/career/cv/${cvId}?adaptation=empty${panel}`);
  const t = await getTranslations("docs.tailor");
  const result = await tailorCvToText(db, user.id, {
    cvId,
    text: parsed.data.text,
    title: (heading) => t("copyName", { heading }),
  });
  if (!result.ok) redirect(`/app/career/cv/${cvId}?adaptation=${result.code}${panel}`);
  openCopy(result);
}

/**
 * The skills of a pasted text, found and missing in the CV, while the talent pastes it (no
 * model, no credit): the chips of « Adapter à un texte ».
 */
export async function tailorKeywordsAction(cvId: string, text: string) {
  const input = tailorTextSchema.safeParse({ cvId, text });
  if (!input.success) return { present: [], missing: [] };
  const user = await requireUser(`/app/career/cv/${cvId}`);
  const cv = await db.document.findFirst({
    where: { id: input.data.cvId, kind: "cv", profile: { userId: user.id } },
    select: { content: true },
  });
  if (!cv) return { present: [], missing: [] };
  return tailorKeywords(db, parseCv(cv.content), input.data.text);
}

/**
 * « Rédiger avec Orbi » while applying (planche talent-2 § 1): a letter for this offer, written
 * from the profile and the offer only, put in the draft for the talent to read and change before
 * sending. The letter is also kept in « Lettres ». Credits and entitlement are checked by `runAi`;
 * applying itself stays free.
 */
export async function applicationLetterAction(formData: FormData) {
  const slug = z.string().min(1).max(200).safeParse(formData.get("job"));
  if (!slug.success) redirect("/app/jobs");
  const back = `/app/jobs/${slug.data}/postuler?etape=lettre`;
  const user = await requireUser(back);
  const job = await db.job.findUnique({ where: { slug: slug.data }, select: { id: true } });
  if (!job) redirect("/app/jobs");
  const result = await generateDocument(
    db,
    user.id,
    generateSchema.parse({ type: "letter", jobId: job.id }),
    await documentTemplate(),
  );
  if (!result.ok) redirect(`${back}&ia=${result.code}`);
  const letter = await getDocument(db, user.id, result.id);
  await saveApplicationDraft(db, {
    userId: user.id,
    jobId: job.id,
    step: "lettre",
    coverLetter: letter?.data.text ?? "",
  });
  refresh();
  redirect(`${back}&lettre=orbi`);
}

// ─── Mes lettres de motivation (téléphone) ───────────────────────────────────

/** The documents of « Mes lettres de motivation » (listDocuments). */
const LETTER_KINDS = ["cover_letter", "bio", "other"] as const;
type LetterResult = { ok: true } | { ok: false; error: string };

async function ownedLetter(userId: string, documentId: string) {
  return db.document.findFirst({
    where: { id: documentId, kind: { in: [...LETTER_KINDS] }, profile: { userId } },
    select: { id: true, updatedAt: true },
  });
}

/** « Supprimer » on the letters chosen with « Sélectionner » (Ephraïm, 31/10/2026). */
export async function deleteLettersAction(
  ids: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = z.array(z.string().min(1).max(64)).min(1).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(DOCUMENTS);
  const { count } = await db.document.deleteMany({
    where: {
      id: { in: parsed.data },
      kind: { in: [...LETTER_KINDS] },
      profile: { userId: user.id },
    },
  });
  if (count === 0) return { ok: false, error: "missing" };
  refresh();
  return { ok: true, count };
}

/** The pencil of a letter › « Titre » (Ephraïm, 31/10/2026). */
export async function renameLetterAction(documentId: string, title: string): Promise<LetterResult> {
  const parsed = z.string().trim().min(1).max(120).safeParse(title);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(DOCUMENTS);
  const letter = await ownedLetter(user.id, documentId);
  if (!letter) return { ok: false, error: "missing" };
  await db.document.update({ where: { id: letter.id }, data: { title: parsed.data } });
  refresh();
  return { ok: true };
}

/** The pencil of a letter › « Étiquette »: one of the profile colours, or none. */
export async function setLetterColorAction(
  documentId: string,
  color: string | null,
): Promise<LetterResult> {
  const parsed = z.enum(PROFILE_COLORS).nullable().safeParse(color);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(DOCUMENTS);
  const letter = await ownedLetter(user.id, documentId);
  if (!letter) return { ok: false, error: "missing" };
  await db.document.update({
    where: { id: letter.id },
    data: { colorTag: parsed.data, updatedAt: letter.updatedAt },
  });
  refresh();
  return { ok: true };
}
