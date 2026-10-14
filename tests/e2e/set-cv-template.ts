/**
 * Test helper run with tsx (Playwright cannot load the Prisma client): puts a CV on a template
 * whatever the plan, as after a downgrade. `tsx tests/e2e/set-cv-template.ts <documentId> <templateId>`
 */
import { createSeedClient } from "../../prisma/seed/client";

const [id, templateId] = process.argv.slice(2);
const db = createSeedClient();
void db.document.update({ where: { id }, data: { templateId } }).finally(() => db.$disconnect());
