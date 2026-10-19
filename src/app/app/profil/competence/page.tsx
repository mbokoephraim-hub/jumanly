import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SkillScreen } from "@/components/talent/profile/screens";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.skills");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The phone's page of this screen of « Mon profil » (planche talent-4 § 3). On a tablet or a
 * computer the same form opens in a window over the profile (`/app/profil?fenetre=competence`).
 */
export default async function SkillPage({ searchParams }: PageProps<"/app/profil/competence">) {
  return <SkillScreen mode="page" params={await searchParams} />;
}
