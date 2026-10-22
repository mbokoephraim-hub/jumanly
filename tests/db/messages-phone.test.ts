import { afterAll, describe, expect, it } from "vitest";
import { sendMessage } from "@/server/services/connect";
import {
  clearConversation,
  ensurePeerConversation,
  phoneConversation,
  phoneInbox,
  searchMessages,
  setEphemeral,
  setMuted,
} from "@/server/services/messages-phone";
import { cleanup, db, newOrganization, newUser } from "./helpers";

// Modèle B, lot B8: the rules of Messages on the phone (silence, ephemeral, clear, rubrics).
const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function pair() {
  const [a, b] = await Promise.all([newUser(), newUser()]);
  users.push(a.id, b.id);
  const connection = await db.connection.create({
    data: { requesterId: a.id, addresseeId: b.id, status: "accepted", respondedAt: new Date() },
  });
  const id = await ensurePeerConversation(db, a.id, connection.id);
  return { a: a.id, b: b.id, id };
}

describe("Messages au téléphone", () => {
  it("le mode silencieux ne concerne que la personne qui l'active", async () => {
    const { a, b, id } = await pair();
    await setMuted(db, a, id, true);
    expect((await phoneConversation(db, a, id)).muted).toBe(true);
    expect((await phoneConversation(db, b, id)).muted).toBe(false);
    await setMuted(db, a, id, false);
    expect((await phoneConversation(db, a, id)).muted).toBe(false);
  });

  it("les messages éphémères disparaissent pour les deux, sans être supprimés", async () => {
    const { a, b, id } = await pair();
    const start = new Date();
    await setEphemeral(db, a, id, 86_400, "Vous avez activé les messages éphémères", start);
    const sent = await sendMessage(db, { userId: a }, id, { body: "Bientôt parti (test)" }, start);
    const later = new Date(start.getTime() + 2 * 86_400_000);
    const seen = (userId: string, now: Date) =>
      phoneConversation(db, userId, id, now).then((row) =>
        row.messages.some((message) => message.body === "Bientôt parti (test)"),
      );
    expect(await seen(b, start)).toBe(true);
    expect(await seen(b, later)).toBe(false);
    expect(await seen(a, later)).toBe(false);
    expect(await db.message.findUnique({ where: { id: sent.messageId } })).not.toBeNull();
    // Only the delays offered, and never between a talent and an organization.
    await expect(setEphemeral(db, a, id, 3600, "x")).rejects.toMatchObject({ code: "invalid" });
  });

  it("effacer la discussion la vide pour soi seulement", async () => {
    const { a, b, id } = await pair();
    const before = new Date(Date.now() - 60_000);
    await sendMessage(db, { userId: b }, id, { body: "Avant l'effacement (test)" }, before);
    await clearConversation(db, a, id);
    expect((await phoneConversation(db, a, id)).messages).toHaveLength(0);
    expect((await phoneConversation(db, b, id)).messages).toHaveLength(1);
    await sendMessage(db, { userId: b }, id, { body: "Après (test)" });
    expect((await phoneConversation(db, a, id)).messages.map((m) => m.body)).toEqual([
      "Après (test)",
    ]);
    // The search does not find what was cleared.
    const found = await searchMessages(db, a, { query: "effacement", type: null });
    expect(found).toHaveLength(0);
  });

  it("range une entreprise dans « Entreprises » tant qu'aucun recruteur n'a écrit", async () => {
    const talent = await newUser();
    const recruiter = await newUser();
    users.push(talent.id, recruiter.id);
    const org = await newOrganization("company");
    orgs.push(org.id);
    const conversation = await db.conversation.create({
      data: {
        kind: "contact_request",
        organizationId: org.id,
        talentUserId: talent.id,
        lastMessageAt: new Date(),
      },
    });
    await db.message.create({
      data: { conversationId: conversation.id, kind: "system", body: "Bien reçu (test)" },
    });
    const tab = async () =>
      (await phoneInbox(db, talent.id)).find((item) => item.id === conversation.id)?.tab;
    expect(await tab()).toBe("entreprises");
    await db.membership.create({
      data: { userId: recruiter.id, organizationId: org.id, role: "recruiter" },
    });
    await db.message.create({
      data: { conversationId: conversation.id, senderId: recruiter.id, body: "Bonjour (test)" },
    });
    expect(await tab()).toBe("recruteurs");
  });

  it("refuse une discussion qui n'est pas la sienne", async () => {
    const { id } = await pair();
    const stranger = await newUser();
    users.push(stranger.id);
    await expect(phoneConversation(db, stranger.id, id)).rejects.toMatchObject({
      code: "notFound",
    });
    await expect(setMuted(db, stranger.id, id, true)).rejects.toMatchObject({ code: "notFound" });
  });
});
