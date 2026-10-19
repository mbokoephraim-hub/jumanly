import { redirect } from "next/navigation";

/** Former portfolio page: projects now live in « Mon profil » (refonte mobile, lot 6). */
export default function FormerPortfolioPage() {
  redirect("/app/profil?section=projets#projets");
}
