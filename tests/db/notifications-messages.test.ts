import { afterAll, describe, expect, it } from "vitest";
import { FakePushSender, pushSender } from "@/server/adapters/push";
import { markRead } from "@/server/services/connect";
import {
  listNotifications,
  markNotificationsRead,
  notificationActors,
  notify,
} from "@/server/services/notifications";
import { pushMessageOf, savePushDevice, vapidKeys } from "@/server/services/push";
import { cleanup, db, newUser } from "./helpers";

// Notifications of messages (Ephraïm 29/10/2026): one line per conversation, the photo of the
// person who wrote, gone once read, and on the phone even outside the app.
const users: string[] = [];

afterAll(async () => {
  await cleanup(users);
  await db.$disconnect();
});

async function people() {
  const [me, other] = await Promise.all([newUser(), newUser()]);
  users.push(me.id, other.id);
  await db.user.update({ where: { id: other.id }, data: { image: "/photos/sublime.webp" } });
  const conversation = await db.conversation.create({
    data: {
      kind: "peer",
      talentUserId: me.id,
      participants: { create: [{ userId: me.id }, { userId: other.id }] },
    },
  });
  return { me: me.id, other: other.id, conversationId: conversation.id };
}

describe("Notifications des messages", () => {
  it("une seule ligne par conversation, avec la photo de la personne", async () => {
    const { me, other, conversationId } = await people();
    const href = `/app/messages/${conversationId}`;
    for (let i = 0; i < 3; i++)
      await notify(db, {
        userIds: [me],
        type: "newMessage",
        payload: { senderName: "Sublime Koyi", company: "", jobTitle: "" },
        href,
        actorId: other,
      });
    const list = await listNotifications(db, me);
    expect(list.filter((item) => item.href === href)).toHaveLength(1);
    const actors = await notificationActors(db, me, list);
    expect(actors.get(list[0]!.id)?.image).toBe("/photos/sublime.webp");
  });

  it("un message ancien sans auteur retrouve la personne de la conversation", async () => {
    const { me, conversationId } = await people();
    const old = await db.notification.create({
      data: {
        userId: me,
        type: "newMessage",
        payload: { senderName: "Sublime Koyi" },
        href: `/app/messages/${conversationId}`,
      },
    });
    const actors = await notificationActors(db, me, [old]);
    expect(actors.get(old.id)?.image).toBe("/photos/sublime.webp");
  });

  it("lue, ou en ouvrant la conversation, la notification quitte la liste", async () => {
    const { me, other, conversationId } = await people();
    await notify(db, {
      userIds: [me],
      type: "connectionRequest",
      payload: { name: "Sublime Koyi" },
      href: "/app/messages/connexions",
      actorId: other,
    });
    await notify(db, {
      userIds: [me],
      type: "newMessage",
      payload: { senderName: "Sublime Koyi" },
      href: `/app/messages/${conversationId}`,
      actorId: other,
    });
    expect(await listNotifications(db, me)).toHaveLength(2);
    await markRead(db, { userId: me }, conversationId);
    expect((await listNotifications(db, me)).map((item) => item.type)).toEqual([
      "connectionRequest",
    ]);
    await markNotificationsRead(db, me);
    expect(await listNotifications(db, me)).toHaveLength(0);
  });

  it("le téléphone reçoit « Nouveau message de … » avec la photo, jamais le contenu", async () => {
    const previous = process.env.PUSH_PROVIDER;
    process.env.PUSH_PROVIDER = "fake";
    try {
      const { me, other, conversationId } = await people();
      await savePushDevice(db, me, {
        endpoint: `https://push.example.test/${me}`,
        p256dh: "cle",
        auth: "secret",
      });
      await notify(db, {
        userIds: [me],
        type: "newMessage",
        payload: { senderName: "Sublime Koyi", company: "", jobTitle: "" },
        href: `/app/messages/${conversationId}`,
        actorId: other,
      });
      const sender = pushSender(await vapidKeys(db)) as FakePushSender;
      const sent = sender.outbox.find((item) => item.device.endpoint.endsWith(me));
      expect(sent?.message).toMatchObject({
        title: "Nouveau message de Sublime Koyi",
        icon: "/photos/sublime.webp",
        url: `/app/messages/${conversationId}`,
      });
    } finally {
      process.env.PUSH_PROVIDER = previous;
    }
  });

  it("une offre en jeu figure dans la ligne du téléphone", () => {
    expect(
      pushMessageOf("newMessage", { senderName: "Awa", jobTitle: "Comptable" }, "/app/messages/x")
        .body,
    ).toContain("« Comptable »");
  });
});
