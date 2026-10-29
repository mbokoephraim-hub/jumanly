import { afterAll, describe, expect, it } from "vitest";
import { connectionsHub } from "@/server/services/connections-hub";
import { acceptConnection, requestConnection } from "@/server/services/connections";
import { cleanup, db, newUser } from "./helpers";

// « Connexions » of the Chat (Ephraïm 29/10/2026): notifications, suggestions, requests.
const users: string[] = [];

afterAll(async () => {
  await cleanup(users);
  await db.$disconnect();
});

async function people(count: number) {
  const list = await Promise.all(Array.from({ length: count }, () => newUser()));
  users.push(...list.map((user) => user.id));
  return list.map((user) => user.id);
}

const connected = (a: string, b: string) =>
  db.connection.create({
    data: { requesterId: a, addresseeId: b, status: "accepted", respondedAt: new Date() },
  });

describe("Connexions du Chat", () => {
  it("une demande arrive dans les notifications, son acceptation aussi", async () => {
    const [me, other] = await people(2);
    expect(await requestConnection(db, other!, me!)).toBe("sent");
    const asked = await db.notification.findFirst({
      where: { userId: me, type: "connectionRequest" },
    });
    expect(asked?.href).toBe("/app/messages/connexions");
    const hub = await connectionsHub(db, me!);
    expect(hub.received.map((row) => row.person.id)).toEqual([other]);
    const conversationId = await acceptConnection(db, me!, hub.received[0]!.id);
    const accepted = await db.notification.findFirst({
      where: { userId: other, type: "connectionAccepted" },
    });
    expect(accepted?.href).toBe(`/app/messages/${conversationId}`);
    const after = await connectionsHub(db, me!);
    expect(after.received).toEqual([]);
    expect(after.connections.map((row) => row.conversationId)).toEqual([conversationId]);
  });

  it("propose les connexions de mes connexions, la plus partagée d'abord, jamais un lien existant", async () => {
    const [me, a, b, far, near, asked] = await people(6);
    await Promise.all([
      connected(me!, a!),
      connected(me!, b!),
      connected(a!, far!),
      connected(a!, near!),
      connected(b!, near!),
      connected(a!, asked!),
      db.connection.create({ data: { requesterId: me!, addresseeId: asked! } }),
    ]);
    const hub = await connectionsHub(db, me!);
    const ids = hub.suggestions.map((row) => row.person.id);
    expect(ids.slice(0, 2)).toEqual([near, far]);
    expect(ids).not.toContain(asked);
    expect(ids).not.toContain(a);
    expect(hub.suggestions[0]!.mutual.sort()).toEqual([a, b].sort());
    expect(hub.sent.map((row) => row.person.id)).toEqual([asked]);
  });
});
