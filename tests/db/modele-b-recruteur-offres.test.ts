/**
 * Modèle B recruteur, M4: the Offres tab of the phone reads and writes the offers through the same
 * services as the computer, always filtered by the organization (règle d'or 6). An offer of another
 * company is never listed, opened, modified, published, closed or ranked.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  closeJob,
  getOrgJob,
  HireError,
  publishJob,
  type HireContext,
} from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { listOffers, saveJobStep } from "@/server/services/hire-offers";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function space(): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  const org = await newOrganization("company");
  orgs.push(org.id);
  await db.membership.create({
    data: { userId: user.id, organizationId: org.id, role: "org_owner" },
  });
  return { userId: user.id, organizationId: org.id, role: "org_owner" };
}

async function offer(organizationId: string) {
  return db.job.create({
    data: {
      organizationId,
      title: "Analyste fictif",
      slug: `test-${randomUUID()}`,
      description: "Offre de test.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "hybrid",
      status: "published",
      publishedAt: new Date(),
    },
  });
}

const poste = {
  title: "Analyste crédit (fictif)",
  domain: "",
  experienceMin: "0",
  city: "Kinshasa",
  country: "RD Congo",
  remote: "onsite",
  contractType: "cdi",
  openings: "1",
  salaryMin: "600",
  salaryMax: "900",
};

describe("Offres du recruteur au téléphone", () => {
  it("ne liste que les offres de son organisation", async () => {
    const mine = await space();
    const other = await space();
    const own = await offer(mine.organizationId);
    const foreign = await offer(other.organizationId);
    const ids = (await listOffers(db, mine, new Date())).map((row) => row.id);
    expect(ids).toContain(own.id);
    expect(ids).not.toContain(foreign.id);
  });

  it("refuse d'ouvrir, de modifier, de publier ou de clôturer l'offre d'une autre entreprise", async () => {
    const mine = await space();
    const other = await space();
    const foreign = await offer(other.organizationId);
    await expect(getOrgJob(db, mine, foreign.id)).rejects.toBeInstanceOf(HireError);
    await expect(saveJobStep(db, mine, "poste", poste, foreign.id)).rejects.toBeInstanceOf(
      HireError,
    );
    await expect(publishJob(db, mine, foreign.id)).rejects.toBeInstanceOf(HireError);
    await expect(closeJob(db, mine, foreign.id)).rejects.toBeInstanceOf(HireError);
    await expect(atsBoard(db, mine, foreign.id)).rejects.toBeInstanceOf(HireError);
    const untouched = await db.job.findUniqueOrThrow({ where: { id: foreign.id } });
    expect(untouched.title).toBe("Analyste fictif");
    expect(untouched.status).toBe("published");
  });

  it("enregistre le brouillon du téléphone dans l'organisation, salaire en centimes", async () => {
    const mine = await space();
    const saved = await saveJobStep(db, mine, "poste", poste);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const job = await db.job.findUniqueOrThrow({ where: { id: saved.jobId } });
    expect(job.organizationId).toBe(mine.organizationId);
    expect(job.status).toBe("draft");
    expect(job.salaryMin).toBe(60_000);
    expect(job.salaryMax).toBe(90_000);
  });
});
