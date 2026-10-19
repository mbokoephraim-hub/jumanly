"use server";

/**
 * « Projets » of Mon profil (lot 6; E10 portfolio). Order of partie 03: validate → session →
 * entitlement (service) → service.
 */
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
  type NewProjectFile,
} from "@/server/services/portfolio";
import { fileStorage } from "@/server/storage";

const PROJECT = "/app/profil/projet";

/** The window of the web profile (`/app/profil?fenetre=projet`) or the page of the phone. */
function failed(error: unknown, projectId?: string, inWindow = false): never {
  if (error instanceof PortfolioError)
    redirect(
      `${inWindow ? "/app/profil" : PROJECT}?${new URLSearchParams({
        ...(inWindow ? { fenetre: "projet" } : {}),
        ...(projectId ? { id: projectId } : {}),
        erreur: error.code,
      })}`,
    );
  throw error;
}

export async function saveProjectAction(formData: FormData) {
  const projectId = String(formData.get("id") ?? "").slice(0, 60) || undefined;
  const inWindow = formData.get("fenetre") === "projet";
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    context: formData.get("context") ?? "",
    skills: [
      ...formData.getAll("skills").map(String),
      ...String(formData.get("newSkills") ?? "")
        .split(",")
        .map((skill) => skill.trim()),
    ].filter((skill, index, all) => skill && all.indexOf(skill) === index),
    visible: formData.get("visible") === "on",
    keep: formData.getAll("keep").map(String),
  });
  if (!parsed.success) failed(new PortfolioError("notFound"), projectId, inWindow);
  const user = await requireUser(PROJECT);
  const files: NewProjectFile[] = [];
  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0)
      files.push({ name: entry.name, bytes: new Uint8Array(await entry.arrayBuffer()) });
  }
  try {
    await saveProject(db, fileStorage(db), user.id, parsed.data, files, projectId);
  } catch (error) {
    failed(error, projectId, inWindow);
  }
  refresh();
  redirect("/app/profil?ok=projets#projets");
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser(PROJECT);
  await deleteProject(db, fileStorage(db), user.id, String(formData.get("id") ?? "").slice(0, 60));
  refresh();
  redirect("/app/profil?ok=projets#projets");
}

/** « Partager mon profil »: publishes or withdraws the public page of the projects. */
export async function setPortfolioPublicAction(formData: FormData) {
  const user = await requireUser("/app/profil");
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { portfolioIntro: true, portfolioLayout: true, portfolioAccent: true },
  });
  try {
    await savePortfolioSettings(db, user.id, {
      intro: profile?.portfolioIntro ?? "",
      layout: profile?.portfolioLayout === "grid" ? "grid" : "classic",
      accent: (profile?.portfolioAccent as "sapin" | "feuille" | "ardoise" | null) ?? undefined,
      public: formData.get("public") === "on",
    });
  } catch (error) {
    if (error instanceof PortfolioError) redirect("/app/profil?erreur=partage&partager=1");
    throw error;
  }
  refresh();
  redirect(`/app/profil?ok=${formData.get("public") === "on" ? "partage" : "prive"}&partager=1`);
}
