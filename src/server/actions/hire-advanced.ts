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
  const page = `/app/hire/offres/${jobId}#attribution`;
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
  const page = `/app/hire/offres/${jobId}#grille`;
  await guarded(
    () => saveScorecardTemplate(db, ctx, jobId, text(formData.get("criteria"), 3000)),
    page,
  );
  redirect(withParam(page, "ok", "grille"));
}

// ─── Candidate page: scorecard and notes ───────────────────────────────────────

export async function submitScorecardAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire", "evaluate");
  const applicationId = id(formData.get("application"));
  const page = `/app/hire/candidats/${applicationId}#evaluation`;
  const names = formData.getAll("criterion").map((value) => text(value, 80));
  await guarded(
    () =>
      submitScorecard(db, ctx, applicationId, {
        recommendation: text(formData.get("recommendation"), 20) as "yes",
        comment: text(formData.get("comment")),
        ratings: names.map((name, index) => ({
          name,
          rating: Number(formData.get(`rating-${index}`) ?? 0),
          comment: text(formData.get(`comment-${index}`), 500),
        })),
      }),
    page,
  );
  redirect(withParam(page, "ok", "evaluation"));
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

// ─── Talent search: contact requests ───────────────────────────────────────────

export async function contactRequestAction(formData: FormData) {
  const { ctx, space } = await requireHire("/app/hire/talents", "manage");
  const profileId = id(formData.get("profile"));
  const page = `/app/hire/talents/${profileId}#contact`;
  const result = await guarded(
    () => createContactRequest(db, ctx, Object.fromEntries(formData)),
    page,
  );
  if (result.status !== "sent") redirect(withParam(page, "erreur", result.status));
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
  redirect(withParam(page, "ok", "contact"));
}

// ─── Pools ─────────────────────────────────────────────────────────────────────

export async function createPoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const pool = await guarded(
    () => createPool(db, ctx, Object.fromEntries(formData)),
    "/app/hire/viviers?nouveau=1",
  );
  redirect(`/app/hire/viviers?vivier=${pool.id}&ok=cree`);
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
  const page = `/app/hire/viviers?vivier=${poolId}`;
  await guarded(() => removeFromPool(db, ctx, poolId, id(formData.get("profile"))), page);
  redirect(withParam(page, "ok", "retire"));
}

export async function renamePoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const poolId = id(formData.get("pool"));
  const page = `/app/hire/viviers?vivier=${poolId}`;
  await guarded(() => renamePool(db, ctx, poolId, text(formData.get("name"), 80)), page);
  redirect(withParam(page, "ok", "renomme"));
}

export async function deletePoolAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/viviers", "manage");
  const poolId = id(formData.get("pool"));
  await guarded(() => deletePool(db, ctx, poolId), `/app/hire/viviers?vivier=${poolId}`);
  redirect("/app/hire/viviers?ok=supprime");
}

// ─── Interviews ────────────────────────────────────────────────────────────────

export async function scheduleInterviewAction(formData: FormData) {
  const { ctx, space } = await requireHire("/app/hire/entretiens", "manage");
  const back = local(formData.get("back"), "/app/hire/entretiens");
  const result = await guarded(
    () =>
      scheduleInterview(db, ctx, {
        application: id(formData.get("application")),
        mode: text(formData.get("mode"), 10),
        duration: text(formData.get("duration"), 4),
        slots: formData.getAll("slot").map((value) => text(value, 20)),
        timezone: text(formData.get("timezone"), 60),
        link: text(formData.get("link"), 300),
        address: text(formData.get("address"), 300),
        message: text(formData.get("message")),
        participants: formData.getAll("participants").map((value) => id(value)),
      }),
    back,
  );
  if (result.status !== "sent") redirect(withParam(back, "erreur", result.status));
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
    href: interview.application.conversation
      ? `/app/messages/${interview.application.conversation.id}`
      : "/app/jobs/candidatures",
  });
  redirect(withParam(back, "ok", "entretien"));
}

export async function cancelInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  await guarded(
    () =>
      cancelInterview(db, ctx, id(formData.get("interview")), text(formData.get("reason"), 1000)),
    "/app/hire/entretiens",
  );
  redirect("/app/hire/entretiens?ok=annule");
}

export async function closeInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  const outcome = formData.get("outcome") === "no_show" ? "no_show" : "done";
  await guarded(
    () => closeInterview(db, ctx, id(formData.get("interview")), outcome),
    "/app/hire/entretiens",
  );
  redirect("/app/hire/entretiens?ok=maj");
}

export async function rescheduleInterviewAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage");
  await guarded(
    () =>
      rescheduleInterview(
        db,
        ctx,
        id(formData.get("interview")),
        formData.getAll("slot").map((value) => text(value, 20)),
      ),
    "/app/hire/entretiens",
  );
  redirect("/app/hire/entretiens?ok=reprogramme");
}
