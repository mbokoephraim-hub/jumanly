"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { mailContactRequested, mailInterviewInvite } from "@/server/hire-emails";
import {
  deleteNote,
  editNote,
  saveScorecardTemplate,
  submitScorecard,
} from "@/server/services/evaluation";
import { HireError } from "@/server/services/hire";
import {
  acceptProposedSlot,
  addInterviewQuestion,
  removeInterviewQuestion,
} from "@/server/services/hire-interviews";
import {
  cancelInterview,
  closeInterview,
  rescheduleInterview,
  scheduleInterview,
} from "@/server/services/interviews";
import { assignJob } from "@/server/services/org-structure";
import {
  addToPool,
  createContactRequest,
  createPool,
  deletePool,
  removeFromPool,
  renamePool,
} from "@/server/services/talent-search";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const text = (value: FormDataEntryValue | null, max = 2000) => String(value ?? "").slice(0, max);

/** Back to a local page only (never an outside address). */
const local = (value: FormDataEntryValue | null, fallback: string) => {
  const path = String(value ?? "");
  return path.startsWith("/app/") && !path.startsWith("//") ? path : fallback;
};

const withParam = (path: string, key: string, value: string) => {
  const [base, hash] = path.split("#");
  const url = new URL(base!, "http://local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${hash ? `#${hash}` : ""}`;
};

async function guarded<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HireError || (error as Error).name === "HireError")
      redirect(withParam(fallback, "erreur", (error as HireError).code));
    throw error;
  }
}

// ─── Attribution and scorecard template (pipeline page) ─────────────────────────

export async function assignJobAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("job"));
  const page = `/app/hire/candidats?offre=${jobId}#attribution`;
  await guarded(
    () =>
      assignJob(db, ctx, jobId, {
        assignedToId: id(formData.get("assignedTo")),
        teamId: id(formData.get("team")),
        departmentId: id(formData.get("department")),
        entityId: id(formData.get("entity")),
        memberIds: formData.getAll("members").map((value) => id(value)),
      }),
    page,
  );
  redirect(withParam(page, "ok", "attribution"));
}

export async function saveScorecardTemplateAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/offres", "manage");
  const jobId = id(formData.get("job"));
  const page = `/app/hire/candidats?offre=${jobId}#grille`;
  await guarded(
    () => saveScorecardTemplate(db, ctx, jobId, text(formData.get("criteria"), 3000)),
    page,
  );
  redirect(withParam(page, "ok", "grille"));
}

// ─── Candidate page: scorecard and notes ───────────────────────────────────────

/**
 * « Enregistrer » an evaluation (planche r2plus EVAL): a rating from 1 to 4 per criterion of the
 * offer's grid, the opinion, and the next step the member suggests. Nothing moves the candidate.
 */
export async function submitScorecardAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const page = `/app/hire/candidats/${applicationId}/evaluation`;
  const back = local(formData.get("back"), `/app/hire/candidats/${applicationId}`);
  const names = formData.getAll("criterion").map((value) => text(value, 80));
  await guarded(
    () =>
      submitScorecard(db, ctx, applicationId, {
        recommendation: text(formData.get("suite"), 20) as "yes",
        comment: text(formData.get("comment")),
        ratings: names.map((name, index) => ({
          name,
          rating: Number(formData.get(`rating-${index}`) ?? 0),
          comment: "",
        })),
      }),
    page,
  );
  redirect(withParam(back, "ok", "evaluation"));
}

export async function editNoteAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const page = `/app/hire/candidats/${applicationId}#notes`;
  await guarded(
    () => editNote(db, ctx, id(formData.get("note")), text(formData.get("body"))),
    page,
  );
  redirect(withParam(page, "ok", "note"));
}

export async function deleteNoteAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const page = `/app/hire/candidats/${applicationId}#notes`;
  await guarded(() => deleteNote(db, ctx, id(formData.get("note"))), page);
  redirect(withParam(page, "ok", "note"));
}

// ─── Talent search: « Proposer l'offre » ────────────────────────────────────────

/**
 * « Envoyer » a proposal to a visible talent (planche r2plus CONTACT): one of the month's
 * proposals; the talent decides, and their contact is only shown if they accept.
 */
export async function proposeOfferAction(formData: FormData) {
  const { ctx, space } = await requireHire("/app/hire/candidats?vue=talents", "manage");
  const profileId = id(formData.get("profile"));
  const page = `/app/hire/talents/${profileId}/proposer`;
  const result = await guarded(
    () =>
      createContactRequest(db, ctx, {
        profile: profileId,
        job: formData.get("annonce") === "on" ? id(formData.get("job")) : "",
        message: text(formData.get("message")),
      }),
    page,
  );
  if (result.status !== "sent") {
    const job = id(formData.get("job"));
    redirect(`${page}?erreur=${result.status}${job ? `&offre=${job}` : ""}`);
  }
  const request = await db.contactRequest.findUniqueOrThrow({
    where: { id: result.requestId },
    select: {
      expiresAt: true,
      profile: { select: { user: { select: { email: true, firstName: true } } } },
    },
  });
  await mailContactRequested(request.profile.user, {
    company: space.organization.name,
    date: request.expiresAt,
  });
  redirect(`/app/hire/talents/${profileId}?ok=proposee`);
}

// ─── Pools ─────────────────────────────────────────────────────────────────────

/** « Créer un vivier »; with a talent (from a profile or a file), the talent is added to it. */
export async function createPoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const back = local(formData.get("back"), "/app/hire/viviers");
  const pool = await guarded(
    () =>
      createPool(db, ctx, {
        name: text(formData.get("name"), 80),
        description: text(formData.get("description"), 300),
        visibility: text(formData.get("visibility"), 10) || "private",
      }),
    withParam(back, "vivier", "invalide"),
  );
  const profileId = id(formData.get("profile"));
  if (profileId) {
    await guarded(() => addToPool(db, ctx, pool.id, profileId), back);
    redirect(withParam(back, "ok", "vivier"));
  }
  redirect(`/app/hire/viviers/${pool.id}?ok=cree`);
}

export async function addToPoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const back = local(formData.get("back"), "/app/hire/viviers");
  await guarded(
    () =>
      addToPool(
        db,
        ctx,
        id(formData.get("pool")),
        id(formData.get("profile")),
        text(formData.get("note"), 300),
      ),
    back,
  );
  redirect(withParam(back, "ok", "vivier"));
}

export async function removeFromPoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const poolId = id(formData.get("pool"));
  const page = `/app/hire/viviers/${poolId}`;
  await guarded(() => removeFromPool(db, ctx, poolId, id(formData.get("profile"))), page);
  redirect(withParam(page, "ok", "retire"));
}

export async function renamePoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const poolId = id(formData.get("pool"));
  const page = `/app/hire/viviers/${poolId}`;
  await guarded(() => renamePool(db, ctx, poolId, text(formData.get("name"), 80)), page);
  redirect(withParam(page, "ok", "renomme"));
}

export async function deletePoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const poolId = id(formData.get("pool"));
  await guarded(() => deletePool(db, ctx, poolId), `/app/hire/viviers/${poolId}`);
  redirect("/app/hire/viviers?ok=supprime");
}

// ─── Interviews ────────────────────────────────────────────────────────────────

export async function scheduleInterviewAction(formData: FormData) {
  const { ctx, space } = await requireHire("/app/hire/entretiens", "manage");
  const applicationId = id(formData.get("application"));
  // A refusal goes back to the planner, which says why.
  const planner = `/app/hire/candidats/${applicationId}/entretien`;
  const result = await guarded(
    () =>
      scheduleInterview(db, ctx, {
        application: applicationId,
        mode: text(formData.get("mode"), 10),
        duration: text(formData.get("duration"), 4),
        slots: formData.getAll("slot").map((value) => text(value, 20)),
        timezone: text(formData.get("timezone"), 60),
        link: text(formData.get("link"), 300),
        address: text(formData.get("address"), 300),
        message: text(formData.get("message")),
        participants: formData.getAll("participants").map((value) => id(value)),
      }),
    planner,
  );
  if (result.status !== "sent") redirect(withParam(planner, "erreur", result.status));
  const interview = await db.interview.findUniqueOrThrow({
    where: { id: result.interviewId },
    include: {
      application: {
        select: {
          job: { select: { title: true } },
          conversation: { select: { id: true } },
          profile: { select: { user: { select: { email: true, firstName: true } } } },
        },
      },
    },
  });
  const t = await getTranslations("connect.invite.mode");
  await mailInterviewInvite(interview.application.profile.user, {
    company: space.organization.name,
    jobTitle: interview.application.job.title,
    mode: t(interview.mode === "audio" ? "call" : interview.mode),
    minutes: interview.durationMinutes,
    slots: interview.slots,
    timezone: interview.timezone,
    href: `/app/suivi/${interview.applicationId}`,
  });
  redirect(`/app/hire/entretiens/${interview.id}?ok=envoye`);
}

export async function cancelInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  const interviewId = id(formData.get("interview"));
  await guarded(
    () => cancelInterview(db, ctx, interviewId, text(formData.get("reason"), 1000)),
    `/app/hire/entretiens/${interviewId}`,
  );
  redirect(`/app/hire/entretiens/${interviewId}?ok=annule`);
}

export async function closeInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  const interviewId = id(formData.get("interview"));
  const outcome = formData.get("outcome") === "no_show" ? "no_show" : "done";
  await guarded(
    () => closeInterview(db, ctx, interviewId, outcome),
    `/app/hire/entretiens/${interviewId}`,
  );
  redirect(`/app/hire/entretiens/${interviewId}?ok=${outcome === "done" ? "fait" : "absent"}`);
}

/** New times for an interview already proposed (the planner with `?entretien=`). */
export async function rescheduleInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  const interviewId = id(formData.get("interview"));
  const planner = `/app/hire/candidats/${id(formData.get("application"))}/entretien?entretien=${interviewId}`;
  await guarded(
    () =>
      rescheduleInterview(
        db,
        ctx,
        interviewId,
        formData.getAll("slot").map((value) => text(value, 20)),
      ),
    planner,
  );
  redirect(`/app/hire/entretiens/${interviewId}?ok=reprogramme`);
}

/** « Accepter » the time the candidate proposed instead. */
export async function acceptProposedSlotAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  const interviewId = id(formData.get("interview"));
  await guarded(
    () => acceptProposedSlot(db, ctx, interviewId, text(formData.get("slot"), 40)),
    `/app/hire/entretiens/${interviewId}`,
  );
  redirect(`/app/hire/entretiens/${interviewId}?ok=confirme`);
}

/** « Ajouter » a question of the team (never about the private life). */
export async function addInterviewQuestionAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "evaluate");
  const interviewId = id(formData.get("interview"));
  const page = `/app/hire/entretiens/${interviewId}`;
  const result = await guarded(
    () => addInterviewQuestion(db, ctx, interviewId, text(formData.get("question"), 400)),
    page,
  );
  redirect(result === "added" ? `${page}?ok=question#questions` : `${page}?question=${result}`);
}

export async function removeInterviewQuestionAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "evaluate");
  const interviewId = id(formData.get("interview"));
  const page = `/app/hire/entretiens/${interviewId}`;
  await guarded(
    () => removeInterviewQuestion(db, ctx, interviewId, text(formData.get("question"), 60)),
    page,
  );
  redirect(`${page}?ok=question-retiree#questions`);
}
