import { afterAll, describe, expect, it } from "vitest";
import {
  authorSignals,
  createPost,
  deletePost,
  FeedError,
  listFeed,
  replyTo,
  setTypeHidden,
  toggleLike,
} from "@/server/services/feed";
import { createReport } from "@/server/services/moderation";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Modèle B, lot B3: the rules of the Fil (docs/modele-b, rangées 05 et 06).
const users: string[] = [];
const orgs: string[] = [];
const labels = { work: "Réalisation", certificate: () => "Attestation" };

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function person() {
  const user = await newUser();
  users.push(user.id);
  return user.id;
}

describe("Fil", () => {
  it("publie, montre dans « Pour vous » et seulement aux abonnés dans « Abonnements »", async () => {
    const author = await person();
    const reader = await person();
    const id = await createPost(db, author, { body: "Une nouvelle fictive" }, labels);
    const forYou = await listFeed(db, reader, "pourvous");
    expect(forYou.some((item) => item.id === id)).toBe(true);
    expect((await listFeed(db, reader, "abonnements")).some((item) => item.id === id)).toBe(false);
    await db.feedFollow.create({ data: { followerId: reader, userId: author } });
    expect((await listFeed(db, reader, "abonnements")).some((item) => item.id === id)).toBe(true);
    // A person's post is not a company's.
    expect((await listFeed(db, reader, "entreprises")).some((item) => item.id === id)).toBe(false);
  });

  it("limite une publication à 220 caractères, pas une réponse", async () => {
    const author = await person();
    await expect(createPost(db, author, { body: "a".repeat(221) }, labels)).rejects.toBeInstanceOf(
      FeedError,
    );
    const id = await createPost(db, author, { body: "a".repeat(220) }, labels);
    await expect(replyTo(db, author, { post: id, body: "b".repeat(500) })).resolves.toBeTruthy();
  });

  it("compte ce que fait un auteur pour « Pour vous » : réponses, jours actifs, connexions", async () => {
    const author = await person();
    const friend = await person();
    const post = await createPost(db, friend, { body: "Une nouvelle fictive" }, labels);
    await replyTo(db, author, { post, body: "Bravo" });
    await db.connection.create({
      data: { requesterId: friend, addresseeId: author, status: "accepted" },
    });
    const signals = (await authorSignals(db, [author])).get(author);
    expect(signals).toEqual({ replies: 1, activeDays: 1, connections: 1, hiredHere: false });
  });

  it("refuse une publication vide", async () => {
    const author = await person();
    await expect(createPost(db, author, { body: "  " }, labels)).rejects.toBeInstanceOf(FeedError);
  });

  it("respecte « Qui peut répondre »", async () => {
    const author = await person();
    const reader = await person();
    const closed = await createPost(
      db,
      author,
      { body: "Réponses fermées", replyPolicy: "nobody" },
      labels,
    );
    await expect(replyTo(db, reader, { post: closed, body: "Bonjour" })).rejects.toMatchObject({
      code: "closed",
    });
    const circle = await createPost(
      db,
      author,
      { body: "Connexions seulement", replyPolicy: "connections" },
      labels,
    );
    await expect(replyTo(db, reader, { post: circle, body: "Bonjour" })).rejects.toMatchObject({
      code: "closed",
    });
    await db.connection.create({
      data: {
        requesterId: author,
        addresseeId: reader,
        status: "accepted",
        respondedAt: new Date(),
      },
    });
    await replyTo(db, reader, { post: circle, body: "Bonjour" });
    // The author is told once.
    const told = await db.notification.count({ where: { userId: author, type: "feedReply" } });
    expect(told).toBe(1);
  });

  it("J'aime se retire au deuxième appui et ne prévient qu'une fois", async () => {
    const author = await person();
    const reader = await person();
    const id = await createPost(db, author, { body: "À aimer" }, labels);
    expect(await toggleLike(db, reader, id)).toBe(true);
    expect(await toggleLike(db, reader, id)).toBe(false);
    expect(await toggleLike(db, reader, id)).toBe(true);
    expect(await db.feedLike.count({ where: { postId: id } })).toBe(1);
    expect(await db.notification.count({ where: { userId: author, type: "feedLike" } })).toBe(1);
  });

  it("« Ne plus voir ce type » masque les publications d'entreprise", async () => {
    const reader = await person();
    const organization = await newOrganization("recruiter");
    orgs.push(organization.id);
    const post = await db.feedPost.create({
      data: { organizationId: organization.id, body: "Portes ouvertes fictives" },
    });
    expect((await listFeed(db, reader, "entreprises")).some((item) => item.id === post.id)).toBe(
      true,
    );
    expect(await setTypeHidden(db, reader, post.id, true)).toBe("company");
    expect((await listFeed(db, reader, "pourvous")).some((item) => item.id === post.id)).toBe(
      false,
    );
    await setTypeHidden(db, reader, post.id, false);
    expect((await listFeed(db, reader, "pourvous")).some((item) => item.id === post.id)).toBe(true);
  });

  it("seul l'auteur supprime sa publication", async () => {
    const author = await person();
    const other = await person();
    const id = await createPost(db, author, { body: "À supprimer" }, labels);
    await expect(deletePost(db, other, id)).rejects.toMatchObject({ code: "notFound" });
    await deletePost(db, author, id);
    expect(await db.feedPost.findUnique({ where: { id } })).toBeNull();
  });

  it("un signalement vise une publication d'un autre, jamais la sienne", async () => {
    const author = await person();
    const reader = await person();
    const id = await createPost(db, author, { body: "Offre douteuse fictive" }, labels);
    const result = await createReport(db, reader, {
      targetType: "post",
      targetId: id,
      reason: "misinformation",
    });
    expect(result).toBe("created");
    const own = await createReport(db, author, {
      targetType: "post",
      targetId: id,
      reason: "other",
    });
    expect(own).toBe("notFound");
  });
});
