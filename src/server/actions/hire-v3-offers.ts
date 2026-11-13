"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgJob, HireError, publishJob } from "@/server/services/hire";
import { saveJobStep, type JobStep } from "@/server/services/hire-offers";

const OFFERS = "/app/hire/offres";
const NEW = `${OFFERS}/nouvelle`;
const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const stepHref = (jobId: string, step: number, params = "") =>
  `${NEW}?offre=${jobId}&etape=${step}${params ? `&${params}` : ""}`;

type Job = Awaited<ReturnType<typeof getOrgJob>>;

/**
 * What the four steps of the job service hold now, as the form would send them: a step of the
 * prototype v3 (seven steps) only sends its own fields, the rest is kept as it is.
 */
function currentValues(job: Job): Record<Exclude<JobStep, "verifier">, Record<string, unknown>> {
  const day = job.closesAt ? job.closesAt.toISOString().slice(0, 10) : "";
  return {
    poste: {
      title: job.title,
      domain: job.domain ?? "",
      experienceMin: String(job.experienceMin),
      city: job.city,
      country: job.country,
      remote: job.remote,
      contractType: job.contractType,
      openings: String(job.openings),
      salaryMin: job.salaryMin === null ? "" : String(Math.round(job.salaryMin / 100)),
      salaryMax: job.salaryMax === null ? "" : String(Math.round(job.salaryMax / 100)),
    },
    description: {
      description: job.description,
      responsibilities: job.responsibilities.join("\n"),
      requirements: job.requirements.join("\n"),
      benefits: job.benefits.join("\n"),
      requiredSkills: job.skills
        .filter((s) => s.importance === "required")
        .map((s) => s.skill.name)
        .join(", "),
      preferredSkills: job.skills
        .filter((s) => s.importance === "preferred")
        .map((s) => s.skill.name)
        .join(", "),
    },
    candidature: {
      closesAt: day,
      documents: job.requestedDocuments,
      questions: JSON.stringify(job.screeningQuestions ?? []),
      instructions: job.applicationInstructions ?? "",
      knockout: (Array.isArray(job.knockoutCriteria) ? job.knockoutCriteria : []).join("\n"),
    },
  };
}

/** The fields each step of the prototype sends, and the step of the service they belong to. */
const FIELDS: Record<number, [Exclude<JobStep, "verifier">, string[]][]> = {
  1: [
    [
      "poste",
      [
        "title",
        "domain",
        "experienceMin",
        "city",
        "country",
        "remote",
        "contractType",
        "openings",
        "salaryMin",
        "salaryMax",
      ],
    ],
    ["candidature", ["closesAt"]],
  ],
  2: [["description", ["description", "responsibilities", "requirements", "benefits"]]],
  3: [
    ["description", ["requiredSkills", "preferredSkills"]],
    ["candidature", ["questions"]],
  ],
  4: [["candidature", ["documents", "instructions"]]],
};

/**
 * One step of « Nouvelle offre » v3 (prototype v3, `V.nouvelle`): saved at once as a draft (the
 * order of CLAUDE.md: valider → session → rôle → service), then the next step, the one before, or
 * « Garder en brouillon ». Steps 5 and 6 only show what follows; step 7 publishes.
 */
export async function saveOfferV3Action(formData: FormData) {
  const { ctx } = await requireHire(OFFERS, "manage", "publish");
  const step = Number(formData.get("step"));
  if (!Number.isInteger(step) || step < 1 || step > 7) redirect(OFFERS);
  const jobId = id(formData.get("id")) || undefined;
  const next = String(formData.get("next") ?? "continue");
  const job = jobId
    ? await getOrgJob(db, ctx, jobId).catch((error) => {
        if (error instanceof HireError) redirect(OFFERS);
        throw error;
      })
    : null;
  if (!job && step !== 1) redirect(NEW);

  let saved = job?.id;
  for (const [serviceStep, fields] of FIELDS[step] ?? []) {
    const raw: Record<string, unknown> = { ...(job ? currentValues(job)[serviceStep] : {}) };
    for (const field of fields)
      raw[field] =
        field === "documents"
          ? formData.getAll(field).map(String)
          : String(formData.get(field) ?? "");
    if (!saved && serviceStep !== "poste") {
      // The first save created the offer: the rest of step 1 goes to it.
      break;
    }
    const result = await saveJobStep(db, ctx, serviceStep, raw, saved).catch((error) => {
      if (error instanceof HireError) redirect(OFFERS);
      throw error;
    });
    if (!result.ok) {
      const params = new URLSearchParams({ erreur: result.error, champ: result.field ?? "" });
      if (result.unknownSkills) params.set("inconnues", result.unknownSkills.join(", "));
      redirect(saved ? stepHref(saved, step, params.toString()) : `${NEW}?etape=1&${params}`);
    }
    if (!saved) {
      saved = result.jobId;
      // A new offer: the closing date of step 1 is kept right after.
      const created = await getOrgJob(db, ctx, saved);
      const candidature = {
        ...currentValues(created).candidature,
        closesAt: String(formData.get("closesAt") ?? ""),
      };
      const second = await saveJobStep(db, ctx, "candidature", candidature, saved);
      if (!second.ok)
        redirect(stepHref(saved, 1, `erreur=${second.error}&champ=${second.field ?? ""}`));
      break;
    }
  }
  if (!saved) redirect(NEW);
  const current = await db.job.findUniqueOrThrow({
    where: { id: saved },
    select: { slug: true, status: true },
  });
  if (current.status === "published" || current.status === "paused") {
    updateTag("jobs");
    updateTag(`job:${current.slug}`);
  }
  if (next === "later") redirect(`${OFFERS}?onglet=brouillons&ok=brouillon`);
  if (next === "back") redirect(stepHref(saved, Math.max(1, step - 1)));
  if (next.startsWith("go:"))
    redirect(stepHref(saved, Math.min(7, Math.max(1, Number(next.slice(3)) || 1))));
  if (step === 7) {
    const result = await publishJob(db, ctx, saved).catch((error) => {
      if (error instanceof HireError) redirect(OFFERS);
      throw error;
    });
    if (result.status === "limit") redirect(stepHref(saved, 7, "limite=1"));
    if (result.status === "incomplete")
      redirect(stepHref(saved, 2, `erreur=${result.missing}&champ=${result.missing}`));
    updateTag("jobs");
    updateTag(`job:${current.slug}`);
    redirect(`${OFFERS}/${saved}?publiee=${result.status === "published" ? "1" : "verification"}`);
  }
  redirect(stepHref(saved, step + 1));
}
