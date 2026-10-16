"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { db } from "@/server/db";
import { requireCourseEditor, requireUser } from "@/server/auth/session";
import {
  addCourseToPath,
  createPath,
  followPath,
  moveCourseInPath,
  pathFormSchema,
  pathStatuses,
  removeCourseFromPath,
  setPathStatus,
  unfollowPath,
  updatePath,
} from "@/server/services/learn-paths";

const value = (formData: FormData, key: string, max = 80) =>
  String(formData.get(key) ?? "").slice(0, max);

// ─── Learner ────────────────────────────────────────────────────

const pathPage = (slug: string) => `/app/learn/parcours/${encodeURIComponent(slug)}`;

/** Learn v2, étape 2: follow a path, then open its next course (enrolled when the plan opens it). */
export async function followPathAction(formData: FormData) {
  const slug = value(formData, "path");
  const user = await requireUser(pathPage(slug));
  const next = await followPath(db, user.id, slug);
  if (next === undefined) notFound();
  refresh();
  if (next && next.state !== "locked") {
    redirect(`/app/learn/${encodeURIComponent(next.slug)}?parcours=${encodeURIComponent(slug)}`);
  }
  redirect(`${pathPage(slug)}?suivi=1`);
}

export async function unfollowPathAction(formData: FormData) {
  const slug = value(formData, "path");
  const user = await requireUser(pathPage(slug));
  await unfollowPath(db, user.id, slug);
  refresh();
  redirect(`${pathPage(slug)}?suivi=0`);
}

// ─── Administration ─────────────────────────────────────────────

const ADMIN = "/admin/formations/parcours";

async function editor() {
  const user = await requireCourseEditor();
  if (!user) notFound();
  return user;
}

async function audit(actorId: string, action: string, targetId: string, metadata?: object) {
  const requestHeaders = await headers();
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType: "learning_path",
      targetId,
      ...(metadata ? { metadata } : {}),
      ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
}

function back(id: string, params: Record<string, string>, anchor = ""): never {
  // The catalog shows the published paths: refreshed after each change.
  updateTag("courses");
  refresh();
  const query = new URLSearchParams(params).toString();
  redirect(`${ADMIN}/${id}${query ? `?${query}` : ""}${anchor}`);
}

/** valider → session → rôle → service → journal. */
export async function createPathAction(formData: FormData) {
  const title = value(formData, "title", 120).trim();
  const user = await editor();
  if (title.length < 3) redirect(`${ADMIN}?erreur=titre#nouveau`);
  const path = await createPath(db, title);
  await audit(user.id, "learning_path.create", path.id);
  back(path.id, { ok: "created" });
}

async function existing(id: string) {
  const path = await db.learningPath.findUnique({ where: { id }, select: { id: true } });
  if (!path) notFound();
  return path.id;
}

export async function updatePathAction(formData: FormData) {
  const parsed = pathFormSchema.safeParse(Object.fromEntries(formData));
  const user = await editor();
  const id = await existing(value(formData, "id", 40));
  if (!parsed.success) back(id, { erreur: "infos" }, "#infos");
  await updatePath(db, id, parsed.data);
  await audit(user.id, "learning_path.update", id);
  back(id, { ok: "saved" }, "#infos");
}

export async function addPathCourseAction(formData: FormData) {
  const courseId = value(formData, "course", 40);
  const user = await editor();
  const id = await existing(value(formData, "id", 40));
  const result = await addCourseToPath(db, id, courseId);
  if (result !== "added") back(id, { erreur: result }, "#formations");
  await audit(user.id, "learning_path.course.add", id, { courseId });
  back(id, { ok: "course" }, "#formations");
}

export async function movePathCourseAction(formData: FormData) {
  const courseId = value(formData, "course", 40);
  const direction = value(formData, "direction") === "up" ? -1 : 1;
  const user = await editor();
  const id = await existing(value(formData, "id", 40));
  await moveCourseInPath(db, id, courseId, direction);
  await audit(user.id, "learning_path.course.move", id, { courseId, direction });
  back(id, {}, "#formations");
}

export async function removePathCourseAction(formData: FormData) {
  const courseId = value(formData, "course", 40);
  const user = await editor();
  const id = await existing(value(formData, "id", 40));
  await removeCourseFromPath(db, id, courseId);
  await audit(user.id, "learning_path.course.remove", id, { courseId });
  back(id, { ok: "course" }, "#formations");
}

export async function setPathStatusAction(formData: FormData) {
  const status = pathStatuses.find((item) => item === formData.get("status"));
  const user = await editor();
  const id = await existing(value(formData, "id", 40));
  if (!status) back(id, {}, "#publication");
  const result = await setPathStatus(db, id, status);
  if (!result.ok) back(id, { erreur: "publication" }, "#publication");
  await audit(user.id, "learning_path.status", id, { status });
  back(id, { ok: status }, "#publication");
}
