/**
 * Database seed (`pnpm db:seed`).
 * E1 adds the plans and their entitlement matrix (docs/05), then the reference data and an
 * obviously fictional demo dataset, for local use and previews only (CLAUDE.md § 11).
 */
async function main() {
  console.log("Aucune donnée à insérer pour l'instant (les forfaits arrivent à l'étape E1).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
