/**
 * Test helper run with tsx: prints the provider's reference of a payment, which the Modèle B waiting
 * screen does not show (the computer's « Je n'ai rien reçu » used to). `tsx tests/e2e/payment-ref.ts <id>`.
 */
import { createSeedClient } from "../../prisma/seed/client";

const [id] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  if (!id) throw new Error("paiement manquant");
  const payment = await db.payment.findUniqueOrThrow({ where: { id } });
  process.stdout.write(payment.providerRef);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
