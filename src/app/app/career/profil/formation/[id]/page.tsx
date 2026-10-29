import { FreshOnEachVisit } from "@/components/phone/fresh-visit";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { EducationForm } from "@/components/phone/career/edit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ensureProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.form");
  return { title: t("educationEdit"), robots: { index: false } };
}

/** « Modifier la formation » on the phone (planche Carrière-formation); `nouvelle` adds one. */
export default async function CareerEducationPage({
  params,
}: PageProps<"/app/career/profil/formation/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/career/profil/formation/${id}`);
  if (!(await isPhone())) redirect("/app/profil#etudes");
  const profile = await ensureProfile(db, user.id);
  const item =
    id === "nouvelle"
      ? null
      : await db.education.findFirst({ where: { id, profileId: profile.id } });
  if (id !== "nouvelle" && !item) notFound();
  const year = (value: number | null | undefined) => (value ? String(value) : "");
  return (
    <CareerTexts>
      <FreshOnEachVisit>
        <EducationForm
          values={{
            id: item?.id ?? null,
            degree: item?.degree ?? "",
            school: item?.school ?? "",
            level: item?.level ?? "bachelor",
            field: item?.field ?? "",
            startYear: year(item?.startYear),
            endYear: year(item?.endYear),
          }}
        />
      </FreshOnEachVisit>
    </CareerTexts>
  );
}
