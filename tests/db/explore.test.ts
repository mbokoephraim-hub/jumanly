import { afterAll, describe, expect, it } from "vitest";
import {
  companyPage,
  exploreSearch,
  peopleToKnow,
  personPage,
  toggleFollowCompany,
} from "@/server/services/explore";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Modèle B, lot B4: who Explorer shows, and what a person's page reveals (docs/modele-b, rangées
// 07 à 10).
const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
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
  it("ne propose que des profils visibles, jamais une connexion ni un profil bloqué", async () => {
    const me = await person("recruiters");
    const visible = await person("recruiters");
    const hidden = await person("private");
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
    expect(ids).toContain(visible);
    for (const id of [me, hidden, anonymous, friend, blocked]) expect(ids).not.toContain(id);
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

  it("une page de personne privée ne s'ouvre qu'à ses connexions", async () => {
    const me = await person("recruiters");
    const secret = await person("private");
    expect(await personPage(db, me, secret)).toBeNull();
    await db.connection.create({
      data: { requesterId: me, addresseeId: secret, status: "accepted", respondedAt: new Date() },
    });
    const page = await personPage(db, me, secret);
    expect(page?.about).toBe("Présentation fictive");
    expect(page?.link).toBe("connected");
  });

  it("la recherche trouve une personne visible par son nom, pas une privée", async () => {
    const me = await person("recruiters");
    const tag = `Zébulon${Date.now()}`;
    const shown = await person("recruiters", `${tag} Visible`);
    await person("private", `${tag} Caché`);
    const found = await exploreSearch(db, me, tag, "personnes");
    expect(found.people.map((row) => row.id)).toEqual([shown]);
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
});
