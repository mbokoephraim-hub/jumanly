import { afterAll, describe, expect, it } from "vitest";
import {
  chatPulse,
  markTyping,
  reactionsOf,
  reactToMessage,
  setPinned,
} from "@/server/services/chat";
import { sendMessage } from "@/server/services/connect";
import {
  ensurePeerConversation,
  phoneConversation,
  phoneInbox,
} from "@/server/services/messages-phone";
import { cleanup, db, newUser } from "./helpers";

// Chat v2 (docs/chat-v2): reactions, pinning, and « écrit… », in the database.
const users: string[] = [];

afterAll(async () => {
  await cleanup(users);
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

describe("Chat v2", () => {
  it("une réaction par personne : la changer, puis la retirer", async () => {
    const { a, b, id } = await pair();
    const sent = await sendMessage(db, { userId: b }, id, { body: "Bonjour (test)" });
    await reactToMessage(db, a, id, sent.messageId, "❤️");
    await reactToMessage(db, b, id, sent.messageId, "👍");
    let map = await reactionsOf(db, [sent.messageId], a);
    expect(map.get(sent.messageId)).toEqual({ emojis: ["❤️", "👍"], count: 2, mine: "❤️" });
    await reactToMessage(db, a, id, sent.messageId, "🎉");
    map = await reactionsOf(db, [sent.messageId], a);
    expect(map.get(sent.messageId)?.mine).toBe("🎉");
    expect(map.get(sent.messageId)?.count).toBe(2);
    await reactToMessage(db, a, id, sent.messageId, null);
    map = await reactionsOf(db, [sent.messageId], a);
    expect(map.get(sent.messageId)).toEqual({ emojis: ["👍"], count: 1, mine: null });
    // Only the six reactions of the mockup, and only in one's own conversations.
    await expect(reactToMessage(db, a, id, sent.messageId, "💩")).rejects.toMatchObject({
      code: "invalid",
    });
    const stranger = await newUser();
    users.push(stranger.id);
    await expect(reactToMessage(db, stranger.id, id, sent.messageId, "❤️")).rejects.toMatchObject({
      code: "notFound",
    });
  });

  it("épingler met la discussion en tête, pour soi seulement", async () => {
    const { a, b, id } = await pair();
    const other = await pair();
    // A second conversation of `a`, more recent.
    const connection = await db.connection.create({
      data: { requesterId: a, addresseeId: other.b, status: "accepted", respondedAt: new Date() },
    });
    const recent = await ensurePeerConversation(db, a, connection.id);
    await sendMessage(db, { userId: other.b }, recent, { body: "Plus récent (test)" });
    await setPinned(db, a, id, true);
    expect((await phoneInbox(db, a))[0]?.id).toBe(id);
    expect((await phoneInbox(db, a))[0]?.pinned).toBe(true);
    expect((await phoneConversation(db, b, id)).item.pinned).toBe(false);
    await setPinned(db, a, id, false);
    expect((await phoneInbox(db, a))[0]?.id).toBe(recent);
  });

  it("« écrit… » se voit de l'autre côté quelques secondes", async () => {
    const { a, b, id } = await pair();
    const now = new Date();
    await markTyping(db, a, id, now);
    expect((await chatPulse(db, b, id, now)).typing).toEqual([id]);
    expect((await chatPulse(db, a, id, now)).typing).toEqual([]);
    const later = new Date(now.getTime() + 10_000);
    expect((await chatPulse(db, b, id, later)).typing).toEqual([]);
  });
});
