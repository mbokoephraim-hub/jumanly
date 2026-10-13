/**
 * Gives the platform administrator role to an existing account (`pnpm admin:promote <email>`).
 * The first administrator of an environment is created this way; the next ones from /admin.
 * The person must then turn on two-step verification in Paramètres > Sécurité to open the admin.
 */
import { createSeedClient } from "../prisma/seed/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage : pnpm admin:promote <e-mail>");
    process.exit(1);
  }
  const db = createSeedClient();
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Aucun compte pour ${email}. Créez d'abord le compte depuis /inscription.`);
      process.exit(1);
    }
    await db.user.update({ where: { id: user.id }, data: { platformRole: "platform_admin" } });
    await db.auditLog.create({
      data: {
        action: "user.role",
        targetType: "user",
        targetId: user.id,
        metadata: { from: user.platformRole, to: "platform_admin", via: "admin:promote" },
      },
    });
    console.log(
      `✓ ${email} est administrateur. Activez la vérification en deux étapes pour ouvrir /admin.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
