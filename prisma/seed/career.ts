/**
 * E10 demo (local and preview only): a published portfolio for the fictional Pro talent, with one
 * obviously fictional project. Everything is fictional (CLAUDE.md § 11).
 */
import type { SeedClient } from "./client";

export const DEMO_PORTFOLIO_SLUG = "demo-portfolio-fictif";

export async function seedCareer(db: SeedClient) {
  const user = await db.user.findUnique({
    where: { email: "talent.pro@jumanly.test" },
    select: { id: true },
  });
  if (!user) return;
  const profile = await db.talentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      portfolioSlug: DEMO_PORTFOLIO_SLUG,
      portfolioPublic: true,
      portfolioIntro: "Portfolio de démonstration : les projets ci-dessous sont fictifs.",
    },
  });
  await db.document.deleteMany({ where: { profileId: profile.id, kind: "portfolio_item" } });
  await db.document.create({
    data: {
      profileId: profile.id,
      kind: "portfolio_item",
      title: "Tableau de suivi des ventes (projet fictif)",
      content: {
        context: "Projet de démonstration imaginé pour présenter le portfolio Jumanly.",
        role: "Conception du tableau et présentation à l'équipe (fictif).",
        result: "Un suivi hebdomadaire plus lisible pour une équipe imaginaire.",
        skills: ["Excel", "Communication"],
        link: null,
        media: [],
        date: "2026-03",
      },
    },
  });
}
