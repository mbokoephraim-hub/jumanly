"use server";

/**
 * Interview simulations (E10). Order of partie 03: validate → session → quota (in the service,
 * one unit per session) → service.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  answerQuestion,
  answerSchema,
  finishInterview,
  InterviewError,
  setupSchema,
  startInterview,
} from "@/server/services/interview-sim";

const HOME = "/app/career/entretiens";

export async function startInterviewAction(formData: FormData) {
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${HOME}?erreur=invalid#preparer`);
  const user = await requireUser(HOME);
  const t = await getTranslations("career.interviews.bank");
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
  const bank = numbers.map((number) =>
    t(`${parsed.data.type}.${number}`, { jobTitle: parsed.data.jobTitle }),
  );
  let id: string;
  try {
    id = (await startInterview(db, user.id, parsed.data, bank)).id;
  } catch (error) {
    if (error instanceof InterviewError) {
      const query = new URLSearchParams({ erreur: error.code, mode: parsed.data.mode });
      if (error.resetsAt) query.set("renouvellement", error.resetsAt.toISOString());
      redirect(`${HOME}?${query}#preparer`);
    }
    throw error;
  }
  redirect(`${HOME}/${id}`);
}

export async function answerInterviewAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").slice(0, 60);
  const user = await requireUser(`${HOME}/${id}`);
  const parsed = answerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${HOME}/${id}?erreur=vide#reponse`);
  try {
    await answerQuestion(db, user.id, id, parsed.data);
  } catch (error) {
    if (error instanceof InterviewError) redirect(HOME);
    throw error;
  }
  refresh();
  redirect(`${HOME}/${id}#reponse`);
}

export async function finishInterviewAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").slice(0, 60);
  const user = await requireUser(`${HOME}/${id}`);
  try {
    await finishInterview(db, user.id, id);
  } catch (error) {
    if (error instanceof InterviewError) redirect(HOME);
    throw error;
  }
  refresh();
  redirect(`${HOME}/${id}#retour`);
}
