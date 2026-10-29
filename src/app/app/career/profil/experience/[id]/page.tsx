import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { ExperienceForm } from "@/components/phone/career/edit";
import { requireUser } from "@/server/auth/session";
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
      : await db.experience.findFirst({ where: { id, profileId: profile.id } });
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
            description: item?.description ?? "",
          }}
        />
      </FreshOnEachVisit>
    </CareerTexts>
  );
}
