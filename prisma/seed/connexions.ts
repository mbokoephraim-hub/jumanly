/**
 * Connexions of the demo (refonte mobile, lot 6, planche talent-4 « Connexions »): four fictional
 * talents around Grâce (grace.ux@): two requests she received, two accepted connections, one
 * of them with a short conversation. Local and preview only; everything here is invented.
 */
import { hashPassword } from "better-auth/crypto";
import { DEMO_PASSWORD } from "./accounts";
import type { SeedClient } from "./client";

const people = [
  {
    email: "daniel.connexion@jumanly.test",
    firstName: "Daniel",
    lastName: "Ilunga",
    headline: "Chef de projet data",
    company: null,
  },
  {
    email: "fatou.connexion@jumanly.test",
    firstName: "Fatou",
    lastName: "Ndiaye",
    headline: "Analyste BI",
    company: null,
  },
  {
    email: "amani.connexion@jumanly.test",
    firstName: "Amani",
    lastName: "Kabila",
    headline: "Data scientist",
    company: "Mwinda Énergie (fictive)",
  },
  {
    email: "joel.connexion@jumanly.test",
    firstName: "Joël",
    lastName: "Mutombo",
    headline: "Comptable",
    company: "Fleuve Banque (fictive)",
  },
] as const;

export async function seedConnections(db: SeedClient) {
  const grace = await db.user.findUnique({
    where: { email: "grace.ux@jumanly.test" },
    select: { id: true },
  });
  if (!grace) return;
  const password = await hashPassword(DEMO_PASSWORD);
  const now = new Date();
  const ids: Record<string, string> = {};
  for (const person of people) {
    const data = {
      name: `${person.firstName} ${person.lastName}`,
      firstName: person.firstName,
      lastName: person.lastName,
      emailVerified: true,
      country: "CD",
      city: "Kinshasa",
      termsAcceptedAt: now,
    };
    const user = await db.user.upsert({
      where: { email: person.email },
      update: data,
      create: { email: person.email, ...data },
    });
    await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
    await db.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password },
    });
    const profile = await db.talentProfile.upsert({
      where: { userId: user.id },
      update: { headline: person.headline, visibility: "recruiters" },
      create: { userId: user.id, headline: person.headline, visibility: "recruiters" },
    });
    await db.experience.deleteMany({ where: { profileId: profile.id } });
    if (person.company) {
      await db.experience.create({
        data: {
          profileId: profile.id,
          title: person.headline,
          company: person.company,
          startDate: new Date("2023-02-01T00:00:00Z"),
          description: "Expérience de démonstration.",
        },
      });
    }
    ids[person.firstName] = user.id;
  }

  // Start again from a clean state: these connections only exist for the demo.
  const everyone = [grace.id, ...Object.values(ids)];
  await db.connection.deleteMany({
    where: { requesterId: { in: everyone }, addresseeId: { in: everyone } },
  });
  const day = 86_400_000;
  const link = (
    requesterId: string,
    addresseeId: string,
    status: "pending" | "accepted",
    daysAgo: number,
  ) =>
    db.connection.create({
      data: {
        requesterId,
        addresseeId,
        status,
        createdAt: new Date(now.getTime() - daysAgo * day),
        respondedAt: status === "accepted" ? new Date(now.getTime() - (daysAgo - 1) * day) : null,
      },
    });
  await link(ids.Daniel!, grace.id, "pending", 1);
  await link(ids.Fatou!, grace.id, "pending", 2);
  const amani = await link(grace.id, ids.Amani!, "accepted", 20);
  const joel = await link(ids["Joël"]!, grace.id, "accepted", 30);
  // Daniel knows Amani and Joël: « 2 en commun ».
  await link(ids.Daniel!, ids.Amani!, "accepted", 40);
  await link(ids["Joël"]!, ids.Daniel!, "accepted", 45);

  for (const connection of [amani, joel]) {
    await db.conversation.create({
      data: {
        kind: "peer",
        connectionId: connection.id,
        talentUserId: connection.requesterId,
        lastMessageAt: connection.respondedAt ?? now,
        participants: {
          create: [{ userId: connection.requesterId }, { userId: connection.addresseeId }],
        },
      },
    });
  }
  const conversation = await db.conversation.findUniqueOrThrow({
    where: { connectionId: amani.id },
  });
  const sent = new Date(now.getTime() - 3 * day);
  await db.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: ids.Amani!,
        body: "Bonjour Grâce, merci pour la connexion. Ton tableau de bord m’a plu. (démo)",
        createdAt: sent,
      },
      {
        conversationId: conversation.id,
        senderId: grace.id,
        body: "Merci Amani ! Je veux bien un conseil pour progresser en SQL. (démo)",
        createdAt: new Date(sent.getTime() + 3_600_000),
      },
    ],
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(sent.getTime() + 3_600_000) },
  });
}
