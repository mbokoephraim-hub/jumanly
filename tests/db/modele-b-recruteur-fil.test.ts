/**
 * Modèle B recruteur, M3: publishing in the Fil from a recruiter's space. Only a member who
 * manages the offers publishes in the company's name; an offer joined is always one of the
 * person's own organization, published; the posts search never shows a blocked person.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPost, FeedError, listFeed, searchPosts } from "@/server/services/feed";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const labels = { work: "Réalisation", certificate: () => "Attestation" };

afterAll(async () => {
  await db.feedPost.deleteMany({ where: { organizationId: { in: orgs } } });
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function person() {
  const user = await newUser();
  users.push(user.id);
  return user.id;
}

async function company() {
  const org = await newOrganization("company");
  orgs.push(org.id);
  return org.id;
}

async function job(organizationId: string, status: "published" | "draft" = "published") {
  return db.job.create({
    data: {
      organizationId,
      title: "Poste fictif",
      slug: `test-${randomUUID()}`,
      description: "Offre de test.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "CD",
      remote: "onsite",
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
  });
}

describe("Fil du recruteur", () => {
  it("publie au nom de l'entreprise seulement quand la personne gère les offres", async () => {
    const author = await person();
    const org = await company();
    await expect(
      createPost(db, author, { body: "Nous recrutons (fictif)", as: "org" }, labels, {
        organizationId: org,
        canPublishAsOrg: false,
      }),
    ).rejects.toBeInstanceOf(FeedError);
    await expect(
      createPost(db, author, { body: "Nous recrutons (fictif)", as: "org" }, labels),
    ).rejects.toBeInstanceOf(FeedError);
    const id = await createPost(
      db,
      author,
      { body: "Nous recrutons (fictif)", as: "org" },
      labels,
      {
        organizationId: org,
        canPublishAsOrg: true,
      },
    );
    const post = await db.feedPost.findUniqueOrThrow({ where: { id } });
    expect(post.organizationId).toBe(org);
    expect(post.authorId).toBe(author);
    // A company's post shows in « Entreprises ».
    const reader = await person();
    expect((await listFeed(db, reader, "entreprises")).some((item) => item.id === id)).toBe(true);
  });

  it("ne joint qu'une offre en ligne de sa propre organisation", async () => {
    const author = await person();
    const mine = await company();
    const other = await company();
    const space = { organizationId: mine, canPublishAsOrg: true };
    const foreign = await job(other);
    await expect(
      createPost(db, author, { body: "Offre", jobId: foreign.id }, labels, space),
    ).rejects.toBeInstanceOf(FeedError);
    const draft = await job(mine, "draft");
    await expect(
      createPost(db, author, { body: "Offre", jobId: draft.id }, labels, space),
    ).rejects.toBeInstanceOf(FeedError);
    const open = await job(mine);
    // Without a recruiter's space, no offer at all.
    await expect(
      createPost(db, author, { body: "Offre", jobId: open.id }, labels),
    ).rejects.toBeInstanceOf(FeedError);
    const id = await createPost(db, author, { body: "", jobId: open.id }, labels, space);
    expect((await db.feedPost.findUniqueOrThrow({ where: { id } })).jobId).toBe(open.id);
  });

  it("annonce un événement à venir, jamais passé", async () => {
    const author = await person();
    const space = { organizationId: await company(), canPublishAsOrg: true };
    const past = new Date(Date.now() - 3 * 86_400_000);
    await expect(
      createPost(db, author, { body: "Portes ouvertes", eventAt: past }, labels, space),
    ).rejects.toBeInstanceOf(FeedError);
    const when = new Date(Date.now() + 7 * 86_400_000);
    const id = await createPost(
      db,
      author,
      { body: "Portes ouvertes", eventAt: when },
      labels,
      space,
    );
    const post = await db.feedPost.findUniqueOrThrow({ where: { id } });
    expect(post.kind).toBe("event");
    expect(post.eventAt?.getTime()).toBe(when.getTime());
  });

  it("cherche dans les publications sans montrer une personne bloquée", async () => {
    const word = `mot${randomUUID().slice(0, 6)}`;
    const viewer = await person();
    const author = await person();
    const blocked = await person();
    const seen = await createPost(db, author, { body: `Un ${word} fictif` }, labels);
    const hidden = await createPost(db, blocked, { body: `Un autre ${word}` }, labels);
    await db.connection.create({
      data: { requesterId: viewer, addresseeId: blocked, status: "blocked" },
    });
    const found = await searchPosts(db, viewer, word);
    expect(found.map((item) => item.id)).toContain(seen);
    expect(found.map((item) => item.id)).not.toContain(hidden);
  });
});
