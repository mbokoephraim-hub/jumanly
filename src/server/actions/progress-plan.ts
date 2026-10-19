"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";
import {
  addStep,
  deleteStep,
  goalSchema,
  planFromDiagnostic,
  saveGoal,
  stepInputSchema,
  toggleStep,
  updateStep,
} from "@/server/services/progress-plan";

const PATH = "/app/career/plan";
const PLAN_KEY = "career.progress_plan";

/** Session, then the `career.progress_plan` entitlement (never a plan name). */
async function planOwner() {
  const user = await requireUser(PATH);
  if (!(await can(db, { type: "user", id: user.id }, PLAN_KEY))) redirect(PATH);
  return user;
}

function done(params = "ok=1"): never {
  refresh();
  redirect(`${PATH}?${params}`);
}

export async function planFromDiagnosticAction() {
  const user = await planOwner();
  const catalog = await catalogLevelOf(db, user.id);
  await planFromDiagnostic(db, user.id, (required) => opensCourse(catalog, required));
  done();
}

export async function saveGoalAction(formData: FormData) {
  const parsed = goalSchema.safeParse({ goal: formData.get("goal") ?? "" });
  const user = await planOwner();
  if (!parsed.success) done("erreur=1");
  await saveGoal(db, user.id, parsed.data.goal);
  done();
}

export async function addStepAction(formData: FormData) {
  const parsed = stepInputSchema.safeParse({
    title: formData.get("title") ?? "",
    due: formData.get("due") ?? "",
  });
  const user = await planOwner();
  if (!parsed.success) done("erreur=1");
  await addStep(db, user.id, parsed.data);
  done();
}

export async function toggleStepAction(formData: FormData) {
  const user = await planOwner();
  await toggleStep(db, user.id, String(formData.get("step") ?? ""));
  done();
}

export async function updateStepAction(formData: FormData) {
  const parsed = stepInputSchema.safeParse({
    title: formData.get("title") ?? "",
    due: formData.get("due") ?? "",
  });
  const user = await planOwner();
  if (!parsed.success) done("erreur=1");
  await updateStep(db, user.id, String(formData.get("step") ?? "").slice(0, 60), parsed.data);
  done();
}

export async function deleteStepAction(formData: FormData) {
  const user = await planOwner();
  await deleteStep(db, user.id, String(formData.get("step") ?? ""));
  done();
}
