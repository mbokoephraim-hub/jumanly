import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchScreen } from "@/components/talent/profile/screens";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.search");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The phone's page of this screen of « Mon profil » (planche talent-4 § 3). On a tablet or a
 * computer the same form opens in a window over the profile (`/app/profil?fenetre=recherche`).
 */
export default async function SearchPage({ searchParams }: PageProps<"/app/profil/recherche">) {
  return <SearchScreen mode="page" params={await searchParams} />;
}
