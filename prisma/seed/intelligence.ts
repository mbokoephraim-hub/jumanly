/** First version of the matching weights (partie 08 § 8.3); later versions are made in /admin/ia. */
import { DEFAULT_WEIGHTS } from "../../src/server/matching/score";
import type { SeedClient } from "./client";

export async function seedIntelligence(db: SeedClient) {
  await db.matchingWeights.upsert({
    where: { version: DEFAULT_WEIGHTS.version },
    update: {},
    create: {
      version: DEFAULT_WEIGHTS.version,
      weights: DEFAULT_WEIGHTS.values,
      activeFrom: new Date("2026-10-01T00:00:00Z"),
      note: "Poids initiaux du cahier des charges (partie 08 § 8.3).",
    },
  });
  console.log(`Poids du matching : version ${DEFAULT_WEIGHTS.version}.`);
}
