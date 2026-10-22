import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeadScreen } from "@/components/talent/profile/screens";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.head");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The phone's page of this screen of « Mon profil » (planche talent-4 § 3). On a tablet or a
 * computer the same form opens in a window over the profile (`/app/profil?fenetre=modifier`).
 */
export default async function EditHeadPage({ searchParams }: PageProps<"/app/profil/modifier">) {
  const params = await searchParams;
  // Modèle B (B5, B9): « Modifier le profil » of Carrière on a phone; a return of this form
  // (`?ok=`, `?erreur=`) keeps it.
  if (Object.keys(params).length === 0) {
    const user = await requireUser("/app/profil/modifier");
    await phoneTalentRedirect(user.id, "/app/career/profil");
  }
  return <HeadScreen mode="page" params={params} />;
}
