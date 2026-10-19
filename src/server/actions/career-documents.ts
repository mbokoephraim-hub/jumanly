"use server";

/**
 * Letters, proofreading, LinkedIn and the CV adapted to a job (E10). Order of partie 03:
 * validate → session → entitlement and credits (in `runAi`) → service.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { saveApplicationDraft } from "@/server/services/application-draft";
import {
  decideCorrections,
  deleteDocument,
  generateDocument,
  generateLinkedin,
  generateSchema,
  getDocument,
  PROOFREAD_MAX,
  proofread,
  saveDocument,
  saveSchema,
  tailorCv,
  type DocumentType,
  type Facts,
  type TemplateValues,
} from "@/server/services/career-documents";

const DOCUMENTS = "/app/career/documents";
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
    return { title: t(`title.${type}`, { jobTitle: v.jobTitle }), text: paragraphs.join("\n\n") };
  };
}

export async function generateDocumentAction(formData: FormData) {
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${DOCUMENTS}?erreur=input#nouveau`);
  const user = await requireUser(DOCUMENTS);
  const result = await generateDocument(db, user.id, parsed.data, await documentTemplate());
  if (!result.ok) redirect(`${DOCUMENTS}?ia=${result.code}#nouveau`);
  redirect(`${DOCUMENTS}/${result.id}?ok=cree`);
}

const proofreadSchema = z.object({
  title: z.string().trim().max(120).default(""),
  text: z.string().trim().min(1).max(PROOFREAD_MAX),
});

export async function proofreadAction(formData: FormData) {
  const parsed = proofreadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${DOCUMENTS}?erreur=input#correction`);
  const user = await requireUser(DOCUMENTS);
  const t = await getTranslations("career.documents.type");
  const result = await proofread(db, user.id, {
    title: parsed.data.title || t("proofread"),
    text: parsed.data.text,
  });
  if (!result.ok) redirect(`${DOCUMENTS}?ia=${result.code}#correction`);
  redirect(`${DOCUMENTS}/${result.id}#corrections`);
}

export async function saveDocumentAction(formData: FormData) {
  const documentId = id(formData.get("id"));
  const user = await requireUser(`${DOCUMENTS}/${documentId}`);
  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${DOCUMENTS}/${documentId}?erreur=input`);
  await saveDocument(db, user.id, documentId, parsed.data);
  refresh();
  redirect(`${DOCUMENTS}/${documentId}?ok=enregistre`);
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
  redirect(`${DOCUMENTS}?ok=supprime`);
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

export async function tailorCvAction(formData: FormData) {
  const cvId = id(formData.get("cvId"));
  const user = await requireUser(`/app/career/cv/${cvId}`);
  const jobId = id(formData.get("jobId"));
  if (!jobId) redirect(`/app/career/cv/${cvId}?adaptation=input#adapter`);
  const t = await getTranslations("career.cv.tailor");
  const result = await tailorCv(db, user.id, {
    cvId,
    jobId,
    title: (jobTitle) => t("name", { jobTitle }),
  });
  if (!result.ok) redirect(`/app/career/cv/${cvId}?adaptation=${result.code}#adapter`);
  redirect(`/app/career/cv/${result.id}?adapte=${encodeURIComponent(result.jobTitle)}`);
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
