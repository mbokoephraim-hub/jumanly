import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { AboutForm } from "@/components/phone/career/edit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getFullProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.form");
  return { title: t("aboutTitle"), robots: { index: false } };
}

/** « À propos » on the phone (planche Carrière-apropos): a title, the text and Orbi's rewrite. */
export default async function CareerAboutPage() {
  const user = await requireUser("/app/career/profil/apropos");
  if (!(await isPhone())) redirect("/app/profil?fenetre=modifier");
  const profile = await getFullProfile(db, user.id);
  return (
    <CareerTexts>
      <AboutForm
        title={profile.aboutTitle ?? ""}
        summary={profile.summary ?? ""}
        target={profile.targetJob}
      />
    </CareerTexts>
  );
}
