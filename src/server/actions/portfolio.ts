"use server";

/** Portfolio (E10). Order of partie 03: validate → session → entitlement (service) → service. */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  deleteProject,
  PortfolioError,
  projectSchema,
  saveProject,
  savePortfolioSettings,
  settingsSchema,
} from "@/server/services/portfolio";

const PORTFOLIO = "/app/career/portfolio";

function failed(error: unknown, anchor: string): never {
  if (error instanceof PortfolioError) redirect(`${PORTFOLIO}?erreur=${error.code}#${anchor}`);
  throw error;
}

export async function saveProjectAction(formData: FormData) {
  const projectId = String(formData.get("id") ?? "").slice(0, 60) || undefined;
  const anchor = projectId ? `projet-${projectId}` : "nouveau";
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${PORTFOLIO}?erreur=input#${anchor}`);
  const user = await requireUser(PORTFOLIO);
  try {
    await saveProject(db, user.id, parsed.data, projectId);
  } catch (error) {
    failed(error, anchor);
  }
  refresh();
  redirect(`${PORTFOLIO}?ok=projet#projets`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser(PORTFOLIO);
  await deleteProject(db, user.id, String(formData.get("id") ?? "").slice(0, 60));
  refresh();
  redirect(`${PORTFOLIO}?ok=supprime#projets`);
}

export async function savePortfolioSettingsAction(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${PORTFOLIO}?erreur=input#presentation`);
  const user = await requireUser(PORTFOLIO);
  try {
    await savePortfolioSettings(db, user.id, parsed.data);
  } catch (error) {
    failed(error, "presentation");
  }
  refresh();
  redirect(`${PORTFOLIO}?ok=presentation#presentation`);
}
