import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { ExperienceForm } from "@/components/phone/career/edit";
import { requireUser } from "@/server/auth/session";
import { ACHIEVEMENTS_SUGGESTED, achievementsOf } from "@/lib/achievements";
import { db } from "@/server/db";
import { dateToMonth, ensureProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.form");
  return { title: t("experienceEdit"), robots: { index: false } };
}

/**
 * « Modifier l'expérience » / « Nouvelle expérience » on the phone (planches Carrière-exp,
 * -exp-new): `nouvelle` opens an empty form.
 */
/** The points of the form: the saved ones, or 3 empty fields (3 to 4 are advised). */
function pointsToEdit(description: string) {
  const points = achievementsOf(description);
  return points.length > 0 ? points : Array.from({ length: ACHIEVEMENTS_SUGGESTED }, () => "");
}

export default async function CareerExperiencePage({
  params,
}: PageProps<"/app/career/profil/experience/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/career/profil/experience/${id}`);
  if (!(await isPhone()))
    redirect(
      id === "nouvelle"
        ? "/app/profil?fenetre=experience"
        : `/app/profil?fenetre=experience&id=${id}`,
    );
  const profile = await ensureProfile(db, user.id);
  const item =
    id === "nouvelle"
      ? null
      : await db.experience.findFirst({
          where: { id, profileId: profile.id },
          include: { organization: { select: { logo: true } } },
        });
  if (id !== "nouvelle" && !item) notFound();
  return (
    <CareerTexts>
      <FreshOnEachVisit>
        <ExperienceForm
          values={{
            id: item?.id ?? null,
            title: item?.title ?? "",
            company: item?.company ?? "",
            location: item?.location ?? "",
            type: item?.type ?? "job",
            start: dateToMonth(item?.startDate),
            end: dateToMonth(item?.endDate),
            current: item ? item.endDate === null : false,
            organizationId: item?.organizationId ?? null,
            organizationLogo: item?.organization?.logo ?? null,
            logo: item?.logo ?? null,
            achievements: pointsToEdit(item?.description ?? ""),
          }}
        />
      </FreshOnEachVisit>
    </CareerTexts>
  );
}
