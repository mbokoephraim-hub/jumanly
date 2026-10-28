"use server";

import { notFound, redirect } from "next/navigation";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  addSkillAlias,
  aliasSchema,
  mergeSchema,
  mergeSkill,
  removeAliasSchema,
  removeSkillAlias,
  SkillAdminError,
} from "@/server/services/skills-admin";

/** « IA et matching › Compétences »: administrators and the career managers. */
const PAGE = "/admin/ia?onglet=competences";

function backOf(formData: FormData) {
  const back = String(formData.get("back") ?? "");
  return back.startsWith(PAGE) ? back : PAGE;
}

function withParam(path: string, key: string, value: string) {
  const [base, hash] = path.split("#");
  const url = `${base}&${key}=${encodeURIComponent(value)}`;
  return hash ? `${url}#${hash}` : url;
}

async function writer() {
  const admin = await requireAdminArea("ai");
  if (!admin) notFound();
  if (!canWriteArea(admin.platformRole, "ai")) redirect("/admin?erreur=lecture");
  return admin;
}

async function run(formData: FormData, done: string, work: () => Promise<unknown>) {
  const back = backOf(formData).replace(/&(ok|erreur)=[^&#]*/g, "");
  try {
    await work();
  } catch (error) {
    if (error instanceof SkillAdminError) redirect(withParam(back, "erreur", error.code));
    throw error;
  }
  redirect(withParam(back, "ok", done));
}

export async function addSkillAliasAction(formData: FormData) {
  const admin = await writer();
  const input = aliasSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "champs"));
  await run(formData, "alias", () => addSkillAlias(db, admin.id, input.data));
}

export async function removeSkillAliasAction(formData: FormData) {
  const admin = await writer();
  const input = removeAliasSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "champs"));
  await run(formData, "aliasRemoved", () => removeSkillAlias(db, admin.id, input.data));
}

export async function mergeSkillAction(formData: FormData) {
  const admin = await writer();
  const input = mergeSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect(withParam(backOf(formData), "erreur", "champs"));
  await run(formData, "merged", () => mergeSkill(db, admin.id, input.data));
}
