import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";

/**
 * Former portfolio page: projects live in « Mon profil » (refonte mobile, lot 6) on a computer,
 * in the Portfolio tab of Carrière on a phone (Modèle B, B5).
 */
export default async function FormerPortfolioPage() {
  const user = await requireUser("/app/career/portfolio");
  await phoneTalentRedirect(user.id, "/app/profil?onglet=realisations");
  redirect("/app/profil?section=projets#projets");
}
