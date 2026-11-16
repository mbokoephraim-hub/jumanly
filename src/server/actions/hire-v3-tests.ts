"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import {
  addQuestion,
  archiveTest,
  createTest,
  gradeInvite,
  removeQuestion,
  sendTest,
  startInvite,
  submitInvite,
  updateTest,
} from "@/server/services/hire-v3-tests";

const TESTS = "/app/hire/tests";
const idOf = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const editor = (id: string, params = "") => `${TESTS}/${id}${params ? `?${params}` : ""}`;

/** Order of CLAUDE.md: validate → session → role → right → service (the service checks both). */
async function guarded<T>(run: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HireError)
      redirect(`${fallback}${fallback.includes("?") ? "&" : "?"}erreur=${error.code}`);
    throw error;
  }
}

const createInput = z.object({
  title: z.string().trim().max(120).optional(),
  job: z.string().trim().max(60).optional(),
  template: z.string().trim().max(30).optional(),
});

/** « Créer un test » (blank or from an offer) and « Utiliser ce modèle » of the library. */
export async function createTestAction(formData: FormData) {
  const parsed = createInput.safeParse({
    title: formData.get("title") ?? undefined,
    job: formData.get("job") ?? undefined,
    template: formData.get("template") ?? undefined,
  });
  if (!parsed.success) redirect(`${TESTS}?erreur=invalid`);
  const { ctx } = await requireHire(TESTS, "manage");
  const test = await guarded(
    () =>
      createTest(db, ctx, {
        title: parsed.data.title,
        jobId: parsed.data.job || null,
        templateKey: parsed.data.template || null,
      }),
    TESTS,
  );
  redirect(editor(test.id));
}

const metaInput = z.object({
  id: z.string().min(1).max(60),
  title: z.string().trim().min(2).max(120),
  job: z.string().trim().max(60),
  minutes: z.coerce.number().int().min(5).max(180),
  level: z.string().max(20),
  instructions: z.string().max(1000),
});

export async function updateTestAction(formData: FormData) {
  const parsed = metaInput.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    job: formData.get("job") ?? "",
    minutes: formData.get("minutes"),
    level: formData.get("level") ?? "",
    instructions: formData.get("instructions") ?? "",
  });
  const id = idOf(formData.get("id"));
  if (!parsed.success) redirect(editor(id, "erreur=invalid"));
  const { ctx } = await requireHire(TESTS, "manage");
  await guarded(
    () =>
      updateTest(db, ctx, parsed.data.id, {
        title: parsed.data.title,
        jobId: parsed.data.job || null,
        minutes: parsed.data.minutes,
        level: parsed.data.level,
        instructions: parsed.data.instructions,
      }),
    editor(id),
  );
  redirect(editor(id, "enregistre=1"));
}

const questionInput = z.object({
  id: z.string().min(1).max(60),
  kind: z.enum(["choice", "short"]),
  prompt: z.string().trim().min(3).max(600),
  choices: z.array(z.string().max(200)).max(6),
  answer: z.coerce.number().int().min(0).max(5).nullable(),
  points: z.coerce.number().int().min(1).max(10),
});

export async function addQuestionAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const kind = formData.get("kind") === "short" ? "short" : "choice";
  const parsed = questionInput.safeParse({
    id,
    kind,
    prompt: formData.get("prompt"),
    choices: formData.getAll("choice").map(String),
    answer: kind === "choice" ? (formData.get("answer") ?? null) : null,
    points: formData.get("points") ?? 1,
  });
  if (!parsed.success) redirect(editor(id, "erreur=invalid#questions"));
  const { ctx } = await requireHire(TESTS, "manage");
  await guarded(
    () =>
      addQuestion(db, ctx, id, {
        kind: parsed.data.kind,
        prompt: parsed.data.prompt,
        choices: parsed.data.choices,
        answer: parsed.data.answer,
        points: parsed.data.points,
      }),
    editor(id),
  );
  redirect(editor(id, "ajoute=1#questions"));
}

export async function removeQuestionAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const { ctx } = await requireHire(TESTS, "manage");
  await guarded(() => removeQuestion(db, ctx, id, idOf(formData.get("question"))), editor(id));
  redirect(editor(id, "retire=1#questions"));
}

export async function archiveTestAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const { ctx } = await requireHire(TESTS, "manage");
  await guarded(() => archiveTest(db, ctx, id), editor(id));
  redirect(`${TESTS}?archive=1`);
}

/** « Envoyer » to the candidates of the offer who have not received the test. */
export async function sendTestAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const back = formData.get("back") === "list" ? TESTS : editor(id);
  const { ctx } = await requireHire(TESTS, "manage");
  const sent = await guarded(() => sendTest(db, ctx, id), back);
  redirect(`${back}${back.includes("?") ? "&" : "?"}envoye=${sent}`);
}

const gradeInput = z.object({
  invite: z.string().min(1).max(60),
  application: z.string().min(1).max(60),
});

/** The team's points for the written answers of one candidate (onglet « Test » of the file). */
export async function gradeInviteAction(formData: FormData) {
  const parsed = gradeInput.safeParse({
    invite: formData.get("invite"),
    application: formData.get("application"),
  });
  if (!parsed.success) redirect(TESTS);
  const back = `/app/hire/candidats/${parsed.data.application}?onglet=test`;
  const grades: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("grade:")) continue;
    const points = Number(value);
    if (Number.isFinite(points) && points >= 0 && points <= 10) grades[key.slice(6, 66)] = points;
  }
  const { ctx } = await requireHire(back, "evaluate");
  await guarded(() => gradeInvite(db, ctx, parsed.data.invite, grades), back);
  redirect(`${back}&note=1`);
}

// ─── The candidate ───────────────────────────────────────────────────────────────

export async function startTestAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const user = await requireUser(`/app/test/${id}`);
  await guarded(() => startInvite(db, user.id, id), `/app/test/${id}`);
  refresh();
}

/** One attempt: the answers of the form, then the « Merci » screen. */
export async function submitTestAction(formData: FormData) {
  const id = idOf(formData.get("id"));
  const user = await requireUser(`/app/test/${id}`);
  const answers: Record<string, number | string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q:")) {
      const raw = String(value).slice(0, 4000);
      answers[key.slice(2, 62)] =
        formData.get(`kind:${key.slice(2, 62)}`) === "choice" ? Number(raw) : raw;
    }
  }
  await guarded(() => submitInvite(db, user.id, id, answers), `/app/test/${id}`);
  redirect(`/app/test/${id}?rendu=1`);
}
