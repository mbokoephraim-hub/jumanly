import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExperienceScreen } from "@/components/talent/profile/screens";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.experience");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The phone's page of this screen of « Mon profil » (planche talent-4 § 3). On a tablet or a
 * computer the same form opens in a window over the profile (`/app/profil?fenetre=experience`).
 */
export default async function ExperiencePage({
  searchParams,
}: PageProps<"/app/profil/experience">) {
  const params = await searchParams;
  // Modèle B (B5, B9): the form of an experience of Carrière on a phone.
  if (!params.erreur && !params.ok) {
    const user = await requireUser("/app/profil/experience");
    const id = typeof params.id === "string" ? params.id.slice(0, 60) : "nouvelle";
    await phoneTalentRedirect(user.id, `/app/career/profil/experience/${encodeURIComponent(id)}`);
  }
  return <ExperienceScreen mode="page" params={params} />;
}
