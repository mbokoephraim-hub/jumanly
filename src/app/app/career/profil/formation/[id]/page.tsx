import { achievementsOf } from "@/lib/achievements";
import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { EducationForm } from "@/components/phone/career/edit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ensureProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";
import { referenceCheckSelect, referenceState } from "@/server/services/reference-check";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.form");
  return { title: t("educationEdit"), robots: { index: false } };
}

/**
 * « Diplôme » / « Certificat » on the phone (demande d'Ephraïm du 29/10/2026): `nouvelle` adds a
 * diploma, `nouvelle?type=certificat` a certificate.
 */
export default async function CareerEducationPage({
  params,
  searchParams,
}: PageProps<"/app/career/profil/formation/[id]">) {
  const { id } = await params;
  const { type } = await searchParams;
  const user = await requireUser(`/app/career/profil/formation/${id}`);
  if (!(await isPhone())) redirect("/app/profil#etudes");
  const profile = await ensureProfile(db, user.id);
  const item =
    id === "nouvelle"
      ? null
      : await db.education.findFirst({
          where: { id, profileId: profile.id },
          include: { referenceChecks: referenceCheckSelect },
        });
  if (id !== "nouvelle" && !item) notFound();
  const year = (value: number | null | undefined) => (value ? String(value) : "");
  const format = await getFormatter();
  const state = referenceState(item?.referenceChecks);
  const kind = item?.kind ?? (type === "certificat" ? "certificate" : "diploma");
  return (
    <CareerTexts>
      <FreshOnEachVisit>
        <EducationForm
          values={{
            id: item?.id ?? null,
            kind,
            degree: item?.degree ?? "",
            school: item?.school ?? "",
            level: item?.level ?? (kind === "certificate" ? "none" : "bachelor"),
            field: item?.field ?? "",
            startYear: year(item?.startYear),
            endYear: year(item?.endYear),
            format: item?.format ?? null,
            length: item?.length ?? null,
            image: item?.image ?? null,
            schoolLogo: item?.schoolLogo ?? null,
            learnings: achievementsOf(item?.learnings ?? ""),
            reference: state
              ? {
                  id: state.id,
                  status: state.status,
                  referentName: state.referentName,
                  at: format.dateTime(state.at, { dateStyle: "medium" }),
                }
              : null,
          }}
        />
      </FreshOnEachVisit>
    </CareerTexts>
  );
}
