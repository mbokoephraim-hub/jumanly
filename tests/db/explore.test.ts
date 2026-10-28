import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  companyPage,
  explorerCount,
  explorerHome,
  exploreSearch,
  peopleToKnow,
  toggleFollowCompany,
} from "@/server/services/explore";
import { NO_FILTERS, residenceWhere } from "@/server/services/explore-filters";
import { personProfile } from "@/server/services/person-profile";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Modèle B, lot B4: who Explorer shows, and what a person's page reveals (docs/modele-b, rangées
// 07 à 10).
const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function person(visibility: "private" | "recruiters" | "anonymous", name = "Test Fictif") {
  const user = await newUser();
  users.push(user.id);
  await db.user.update({ where: { id: user.id }, data: { name } });
  await db.talentProfile.create({
    data: {
      userId: user.id,
      visibility,
      summary: "Présentation fictive",
      headline: "Analyste fictif",
    },
  });
  return user.id;
}

describe("Explorer", () => {
  it("propose les profils visibles et privés, jamais un anonyme, une connexion ni un profil bloqué", async () => {
    const me = await person("recruiters");
    const visible = await person("recruiters");
    const privateOne = await person("private");
    const anonymous = await person("anonymous");
    const friend = await person("recruiters");
    const blocked = await person("recruiters");
    await db.connection.create({
      data: { requesterId: me, addresseeId: friend, status: "accepted", respondedAt: new Date() },
    });
    await db.connection.create({
      data: { requesterId: blocked, addresseeId: me, status: "blocked", blockedById: blocked },
    });
    const ids = (await peopleToKnow(db, me, 500)).map((row) => row.id);
    // Ephraïm 27/10/2026 (#192): every member can be found from sign-up, private ones included.
    expect(ids).toContain(visible);
    expect(ids).toContain(privateOne);
    for (const id of [me, anonymous, friend, blocked]) expect(ids).not.toContain(id);
  });

  it("met d'abord les personnes qui ont des connexions en commun", async () => {
    const me = await person("recruiters");
    const friend = await person("recruiters");
    const common = await person("recruiters");
    await db.connection.createMany({
      data: [
        { requesterId: me, addresseeId: friend, status: "accepted", respondedAt: new Date() },
        { requesterId: friend, addresseeId: common, status: "accepted", respondedAt: new Date() },
      ],
    });
    const [first] = await peopleToKnow(db, me, 5);
    expect(first?.id).toBe(common);
    expect(first?.reason).toEqual({ kind: "mutual", count: 1 });
  });

  it("une page de personne privée ne s'ouvre en entier qu'à ses connexions", async () => {
    const me = await person("recruiters");
    const secret = await person("private");
    expect((await personProfile(db, me, secret, "connection"))?.about).toBeNull();
    await db.connection.create({
      data: { requesterId: me, addresseeId: secret, status: "accepted", respondedAt: new Date() },
    });
    const page = await personProfile(db, me, secret, "connection");
    expect(page?.about).toBe("Présentation fictive");
    expect(page?.link).toBe("connected");
  });

  it("le profil d'une personne : réseaux remplis, e-mail seulement si elle le montre", async () => {
    const me = await person("recruiters");
    const other = await person("recruiters");
    await db.talentProfile.update({
      where: { userId: other },
      data: {
        handle: `fictif.${Date.now()}`,
        socialLinks: {
          linkedin: "https://www.linkedin.com/in/fictif",
          x: "https://evil.example/x",
        },
      },
    });
    const first = await personProfile(db, me, other, "connection");
    expect(first?.socials).toEqual({ linkedin: "https://www.linkedin.com/in/fictif" });
    expect(first?.email).toBeNull();
    await db.talentProfile.update({ where: { userId: other }, data: { showEmail: true } });
    const second = await personProfile(db, me, other, "connection");
    expect(second?.email).toMatch(/@/);
  });

  it("un profil bloqué ou anonyme ne s'ouvre pas ; un privé s'ouvre réduit ; un recruteur voit le profil privé d'un candidat", async () => {
    const me = await person("recruiters");
    const blocker = await person("recruiters");
    const secret = await person("private");
    const hidden = await person("anonymous");
    await db.connection.create({
      data: { requesterId: blocker, addresseeId: me, status: "blocked", blockedById: blocker },
    });
    expect(await personProfile(db, me, blocker, "connection")).toBeNull();
    expect(await personProfile(db, me, hidden, "connection")).toBeNull();
    // Ephraïm 27/10/2026 (#192): a private profile opens with its name, photo, title and city only.
    const limited = await personProfile(db, me, secret, "connection");
    expect(limited?.id).toBe(secret);
    expect(limited?.headline).toBe("Analyste fictif");
    expect(limited?.about).toBeNull();
    expect(limited?.experiences).toEqual([]);
    // The application was checked by the caller (recordView): the profile opens.
    expect((await personProfile(db, me, secret, "candidate"))?.id).toBe(secret);
  });

  it("la recherche trouve une personne visible ou privée par son nom, pas une anonyme", async () => {
    const me = await person("recruiters");
    const tag = `Zébulon${Date.now()}`;
    const shown = await person("recruiters", `${tag} Visible`);
    const privateOne = await person("private", `${tag} Privé`);
    await person("anonymous", `${tag} Caché`);
    const found = await exploreSearch(db, me, tag, "personnes");
    expect(found.people.map((row) => row.id).sort()).toEqual([shown, privateOne].sort());
    expect(found.offers).toEqual([]);
  });

  it("« Suivre » une entreprise se retire au deuxième appui", async () => {
    const me = await person("recruiters");
    const org = await newOrganization("company");
    orgs.push(org.id);
    expect(await toggleFollowCompany(db, me, org.slug)).toBe(true);
    expect((await companyPage(db, me, org.slug))?.followers).toBe(1);
    expect(await toggleFollowCompany(db, me, org.slug)).toBe(false);
    const page = await companyPage(db, me, org.slug);
    expect(page?.followers).toBe(0);
    expect(page?.following).toBe(false);
  });

  it("les filtres choisissent les offres, les entreprises et les personnes sur le serveur", async () => {
    const me = await person("recruiters");
    const mines = await newOrganization("company");
    const transport = await newOrganization("company");
    orgs.push(mines.id, transport.id);
    await db.organization.update({ where: { id: mines.id }, data: { sector: "Mines (fictif)" } });
    await db.organization.update({
      where: { id: transport.id },
      data: { sector: "Transport (fictif)" },
    });
    const offer = (
      organizationId: string,
      contractType: "cdi" | "cdd" | "stage",
      salary: [number, number] | null,
    ) =>
      db.job.create({
        data: {
          organizationId,
          title: "Poste fictif",
          slug: `test-${randomUUID()}`,
          description: "Offre de test.",
          contractType,
          city: "Kinshasa",
          country: "CD",
          remote: "onsite",
          status: "published",
          publishedAt: new Date(),
          salaryMin: salary ? salary[0] * 100 : null,
          salaryMax: salary ? salary[1] * 100 : null,
        },
      });
    const cdi = await offer(mines.id, "cdi", [900, 1100]);
    const stage = await offer(mines.id, "stage", [200, 250]);
    const cdd = await offer(transport.id, "cdd", null);
    const ids = async (filters: Partial<typeof NO_FILTERS>) =>
      (await explorerHome(db, me, new Date(), { ...NO_FILTERS, ...filters })).offers.map(
        (row) => row.id,
      );

    const byContract = await ids({ contracts: ["cdi"] });
    expect(byContract).toContain(cdi.id);
    expect(byContract).not.toContain(stage.id);
    expect(byContract).not.toContain(cdd.id);

    const bySalary = await ids({ salary: "lt300" });
    expect(bySalary).toContain(stage.id);
    expect(bySalary).not.toContain(cdi.id);
    // No salary given: never in a range.
    expect(bySalary).not.toContain(cdd.id);

    const bySector = await explorerHome(db, me, new Date(), { ...NO_FILTERS, sectors: ["mines"] });
    expect(bySector.offers.map((row) => row.id)).toEqual(
      expect.arrayContaining([cdi.id, stage.id]),
    );
    expect(bySector.offers.map((row) => row.id)).not.toContain(cdd.id);
    expect(bySector.companies.map((row) => row.id)).toContain(mines.id);
    expect(bySector.companies.map((row) => row.id)).not.toContain(transport.id);

    // « Voir N résultats » counts only the scope chosen.
    const count = await explorerCount(db, me, {
      ...NO_FILTERS,
      scope: "offres",
      sectors: ["mines"],
    });
    expect(count.offers).toBeGreaterThanOrEqual(2);
    expect(count.companies).toBe(0);
    expect(count.people).toBe(0);
    expect(count.total).toBe(count.offers);
  });

  it("le filtre de résidence lit le pays du profil, jamais la nationalité", async () => {
    const me = await person("recruiters");
    const kinshasa = await person("recruiters");
    const dakar = await person("recruiters");
    await db.user.update({ where: { id: kinshasa }, data: { country: "CD" } });
    await db.user.update({ where: { id: dakar }, data: { country: "SN" } });
    const rdc = (await peopleToKnow(db, me, 500, residenceWhere("rdc"))).map((row) => row.id);
    expect(rdc).toContain(kinshasa);
    expect(rdc).not.toContain(dakar);
    const other = (await peopleToKnow(db, me, 500, residenceWhere("autre"))).map((row) => row.id);
    expect(other).toContain(dakar);
    expect(other).not.toContain(kinshasa);
    const everywhere = (await peopleToKnow(db, me, 500, residenceWhere("partout"))).map(
      (row) => row.id,
    );
    expect(everywhere).toEqual(expect.arrayContaining([kinshasa, dakar]));
  });
});
