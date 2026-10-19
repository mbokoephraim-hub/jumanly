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
  interviewTypes,
  setupSchema,
  startInterview,
} from "@/server/services/interview-sim";

const HOME = "/app/career/entretiens";

/** The briefing of an interview (planche talent-2 § 4) sends its errors back to itself. */
const backOf = (formData: FormData) => {
  const from = String(formData.get("from") ?? "");
  return from.startsWith(`${HOME}/nouveau`) && !from.includes("#") ? from : null;
};
const withQuery = (base: string, query: URLSearchParams) =>
  `${base}${base.includes("?") ? "&" : "?"}${query}`;

export async function startInterviewAction(formData: FormData) {
  const back = backOf(formData);
  // « Types de questions » (planche talent-4 § 5 bis) may tick several types: the questions of
  // their banks alternate, the first one names the session.
  const types = interviewTypes.filter((type) => formData.getAll("type").includes(type));
  const parsed = setupSchema.safeParse({ ...Object.fromEntries(formData), type: types[0] });
  if (!parsed.success)
    redirect(
      back ? withQuery(back, new URLSearchParams({ erreur: "invalid" })) : `${HOME}?erreur=invalid`,
    );
  const user = await requireUser(HOME);
  const t = await getTranslations("career.interviews.bank");
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
  const bank = numbers.flatMap((number) =>
    types.map((type) => t(`${type}.${number}`, { jobTitle: parsed.data.jobTitle })),
  );
  let id: string;
  try {
    id = (await startInterview(db, user.id, parsed.data, bank)).id;
  } catch (error) {
    if (error instanceof InterviewError) {
      const query = new URLSearchParams({ erreur: error.code, mode: parsed.data.mode });
      if (error.resetsAt) query.set("renouvellement", error.resetsAt.toISOString());
      redirect(back ? withQuery(back, query) : `${HOME}?${query}`);
    }
    throw error;
  }
  redirect(`${HOME}/${id}`);
}

export async function answerInterviewAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").slice(0, 60);
  const user = await requireUser(`${HOME}/${id}`);
  // « Passer » (planche talent-2 § 4): the question stays without an answer in the feedback.
  const skip = formData.get("skip") === "1";
  const parsed = answerSchema.safeParse(Object.fromEntries(formData));
  if (!skip && !parsed.success) redirect(`${HOME}/${id}?erreur=vide#reponse`);
  try {
    await answerQuestion(db, user.id, id, skip || !parsed.success ? { answer: "" } : parsed.data);
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
