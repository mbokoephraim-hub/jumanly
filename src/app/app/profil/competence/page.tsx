import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SkillScreen } from "@/components/talent/profile/screens";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.skills");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The phone's page of this screen of « Mon profil » (planche talent-4 § 3). On a tablet or a
 * computer the same form opens in a window over the profile (`/app/profil?fenetre=competence`).
 */
export default async function SkillPage({ searchParams }: PageProps<"/app/profil/competence">) {
  const params = await searchParams;
  // Modèle B (B5, B9): skills are added from the CV of Carrière on a phone.
  if (Object.keys(params).length === 0) {
    const user = await requireUser("/app/profil/competence");
    await phoneTalentRedirect(user.id, "/app/career/cv?ajouter=competences");
  }
  return <SkillScreen mode="page" params={params} />;
}
