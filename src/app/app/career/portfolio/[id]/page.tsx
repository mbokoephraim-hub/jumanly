import type { Metadata } from "next";
import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ProjectDetail, ProjectForm } from "@/components/phone/career/portfolio";
import { CareerTexts } from "@/components/phone/career/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { parseProject, portfolioLevel, projectText } from "@/server/services/portfolio";
import { ensureProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.project");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * A project of the portfolio on the phone (planches Carrière-real, -real-ajout, -real-suppr):
 * `nouvelle` opens the empty form, `?modifier=1` the form of the project. Without the portfolio in
 * the plan, « Ajouter » shows the plans.
 */
export default async function CareerProjectPage({
  params,
  searchParams,
}: PageProps<"/app/career/portfolio/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/career/portfolio/${id}`);
  const fresh = id === "nouvelle";
  if (!(await isPhone()))
    redirect(fresh ? "/app/profil?fenetre=projet" : `/app/profil?fenetre=projet&id=${id}`);
  const profile = await ensureProfile(db, user.id);
  const document = fresh
    ? null
    : await db.document.findFirst({
        where: { id, profileId: profile.id, kind: "portfolio_item" },
        select: { id: true, title: true, content: true, createdAt: true },
      });
  const project = document ? parseProject(document) : null;
  if (!fresh && !project) notFound();
  const editing = fresh || query.modifier === "1";
  if (editing && (await portfolioLevel(db, user.id)) === "none") redirect("/app/abonnement");

  const photos = (project?.files ?? []).flatMap((file, index) =>
    file.type.startsWith("image/") ? [{ key: file.key, src: `/api/projets/${id}/${index}` }] : [],
  );
  const documents = (project?.files ?? []).flatMap((file, index) =>
    file.type.startsWith("image/")
      ? []
      : [{ key: file.key, name: file.name, href: `/api/projets/${id}/${index}` }],
  );
  if (editing)
    return (
      <CareerTexts>
        <FreshOnEachVisit>
          <ProjectForm
            key={project?.id ?? "nouvelle"}
            values={{
              id: project?.id ?? null,
              title: project?.title ?? "",
              context: project ? projectText(project) : "",
              link: project?.link ?? "",
              skills: project?.skills ?? [],
              visible: project?.visible ?? false,
              photos,
              documents: documents.map(({ key, name }) => ({ key, name })),
            }}
          />
        </FreshOnEachVisit>
      </CareerTexts>
    );

  const t = await getTranslations("phoneCareer.project");
  const format = await getFormatter();
  const date = project!.date ? new Date(`${project!.date}-01T00:00:00Z`) : document!.createdAt;
  const meta = [
    project!.skills[0],
    photos.length > 0 ? t("photoCount", { count: photos.length }) : null,
    format.dateTime(date, { month: "long", year: "numeric", timeZone: "UTC" }),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <CareerTexts>
      <ProjectDetail
        project={{
          id: project!.id,
          title: project!.title,
          meta,
          text: projectText(project!),
          skills: project!.skills,
          photos: photos.map((photo) => photo.src),
          link: project!.link,
          featured: project!.visible,
          documents: documents.map(({ name, href }) => ({ name, href })),
        }}
      />
    </CareerTexts>
  );
}
