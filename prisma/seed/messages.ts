/**
 * Messages of the demo (Modèle B, lot B8, planches `Messages*.dc.html`): Grâce (grace.ux@) talks
 * with three talents of the Fil, shares a contact with Amani, has two requests with a word, and a
 * company that only acknowledged her application. The photo and the voice note are drawn here.
 * Local and preview only; every person, word, photo and sound here is invented.
 */
import sharp from "sharp";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { storePhoto, storeVoice } from "../../src/server/services/message-media";
import type { SeedClient } from "./client";

const MINUTE = 60_000;
const DAY = 86_400_000;

/** A fictional dashboard drawn as a picture: bars on the dark green of the brand. */
async function dashboardPhoto() {
  const bars = [52, 88, 70, 120, 96, 140, 112]
    .map(
      (height, index) =>
        `<rect x="${70 + index * 70}" y="${300 - height}" width="40" height="${height}" rx="6" fill="#a6f26b"/>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="600" height="400" fill="#0f3f37"/>
    <rect x="40" y="40" width="520" height="300" rx="18" fill="#13282c"/>
    <rect x="70" y="70" width="180" height="14" rx="7" fill="#f2ede5"/>
    <rect x="70" y="96" width="110" height="10" rx="5" fill="#5fe0b8"/>
    ${bars}
    <rect x="70" y="306" width="460" height="2" fill="#2a3a3d"/>
  </svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

/** A short, quiet sound (no voice): a WAV of a few seconds, enough to try the player. */
function voiceNote(seconds: number) {
  const rate = 8000;
  const samples = rate * seconds;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const time = index / rate;
    const swell = Math.abs(Math.sin(Math.PI * time * 1.5));
    const value = Math.sin(2 * Math.PI * 220 * time) * swell * 2500;
    buffer.writeInt16LE(Math.round(value), 44 + index * 2);
  }
  return new Uint8Array(buffer);
}

type Line = {
  from: "grace" | "other" | null;
  body: string;
  minutesAgo: number;
  kind?: "text" | "image" | "voice" | "contact" | "system";
  payload?: object;
};

export async function seedMessages(db: SeedClient) {
  const emails = [
    "grace.ux@jumanly.test",
    "patrick.fil@jumanly.test",
    "joel.fil@jumanly.test",
    "sarah.fil@jumanly.test",
    "amani.connexion@jumanly.test",
    "daniel.connexion@jumanly.test",
    "fatou.connexion@jumanly.test",
  ];
  const users = await db.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  const user = (email: string) => users.find((row) => row.email === email);
  const grace = user("grace.ux@jumanly.test");
  const patrick = user("patrick.fil@jumanly.test");
  const joel = user("joel.fil@jumanly.test");
  const sarah = user("sarah.fil@jumanly.test");
  const amani = user("amani.connexion@jumanly.test");
  if (!grace || !patrick || !joel || !sarah || !amani) return;
  const now = Date.now();
  const ago = (minutes: number) => new Date(now - minutes * MINUTE);

  // The word that comes with each request (planche Messages-demandes).
  const notes: Record<string, string> = {
    "daniel.connexion@jumanly.test":
      "Bonjour Grâce, j’ai vu votre portfolio, j’aimerais rester en contact.",
    "fatou.connexion@jumanly.test": "On a suivi le même cours SQL !",
  };
  for (const [email, note] of Object.entries(notes)) {
    const requester = user(email);
    if (!requester) continue;
    await db.connection.updateMany({
      where: { requesterId: requester.id, addresseeId: grace.id, status: "pending" },
      data: { note },
    });
  }

  // Sarah gets the same two requests, for the e2e of the requests (accept, ignore): Grâce's stay
  // as they are for the other journeys that use them.
  const daniel = user("daniel.connexion@jumanly.test");
  const fatou = user("fatou.connexion@jumanly.test");
  for (const requester of [daniel, fatou]) {
    if (!requester) continue;
    await db.connection.deleteMany({
      where: {
        OR: [
          { requesterId: requester.id, addresseeId: sarah.id },
          { requesterId: sarah.id, addresseeId: requester.id },
        ],
      },
    });
    await db.connection.create({
      data: {
        requesterId: requester.id,
        addresseeId: sarah.id,
        status: "pending",
        note: notes[requester.email]?.replace("Grâce", "Sarah") ?? null,
        createdAt: ago(requester === daniel ? 24 * 60 : 2 * 24 * 60),
      },
    });
  }

  // Three talents of the Fil, connected with Grâce, start again from a clean state.
  const others = [patrick, joel, sarah];
  await db.connection.deleteMany({
    where: {
      OR: others.flatMap((other) => [
        { requesterId: grace.id, addresseeId: other.id },
        { requesterId: other.id, addresseeId: grace.id },
      ]),
    },
  });

  const talk = async (
    other: { id: string },
    connectedDaysAgo: number,
    lines: Line[],
    unread: number,
  ) => {
    const connection = await db.connection.create({
      data: {
        requesterId: other.id,
        addresseeId: grace.id,
        status: "accepted",
        createdAt: new Date(now - (connectedDaysAgo + 1) * DAY),
        respondedAt: new Date(now - connectedDaysAgo * DAY),
      },
    });
    const conversation = await db.conversation.create({
      data: {
        kind: "peer",
        connectionId: connection.id,
        talentUserId: other.id,
        lastMessageAt: ago(lines.at(-1)?.minutesAgo ?? 0),
        participants: { create: [{ userId: other.id }, { userId: grace.id }] },
      },
    });
    for (const line of lines) {
      let payload = line.payload ?? {};
      if (line.kind === "image") {
        const photo = await storePhoto(
          db as unknown as PrismaClient,
          conversation.id,
          await dashboardPhoto(),
          false,
        );
        payload = { files: [photo], hd: false };
      }
      if (line.kind === "voice") {
        payload = await storeVoice(db as unknown as PrismaClient, conversation.id, voiceNote(6), 6);
      }
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: line.from === "grace" ? grace.id : line.from === "other" ? other.id : null,
          kind: line.kind ?? "text",
          body: line.body,
          payload,
          createdAt: ago(line.minutesAgo),
        },
      });
    }
    // Grâce read everything but the last `unread` messages; the other side read everything.
    const readUntil = lines.at(-(unread + 1));
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: conversation.id, userId: grace.id } },
      data: { lastReadAt: readUntil ? new Date(ago(readUntil.minutesAgo).getTime() + 1000) : null },
    });
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: conversation.id, userId: other.id } },
      data: { lastReadAt: ago(0) },
    });
    return conversation;
  };

  await talk(
    patrick,
    10,
    [
      {
        from: "other",
        body: "Salut Grâce ! J’ai vu ton tableau de bord des ventes dans le Fil. Très propre.",
        minutesAgo: 80,
      },
      {
        from: "grace",
        body: "Merci Patrick ! J’ai validé SQL sur Jumanly ce mois-ci.",
        minutesAgo: 76,
      },
      { from: "other", body: "Photo", kind: "image", minutesAgo: 74 },
      {
        from: "other",
        body: "Voilà celui qu’on utilise chez nous pour le suivi des prêts.",
        minutesAgo: 74,
      },
      {
        from: "other",
        body: "Baobab Fintech cherche une analyste junior, tu as postulé ?",
        minutesAgo: 69,
      },
      {
        from: "other",
        body: "Analyste de données junior · Baobab Fintech (fictive)",
        payload: { link: "https://jumanly.io/offres/ux-analyste-donnees-junior-kinshasa" },
        minutesAgo: 68,
      },
    ],
    2,
  );
  await talk(
    joel,
    20,
    [
      { from: "grace", body: "Tu as fini le cours SQL ?", minutesAgo: 24 * 60 },
      { from: "other", body: "Presque !", minutesAgo: 140 },
      { from: "other", body: "Les jointures me prennent la tête", minutesAgo: 139 },
      { from: "other", body: "Tu as compris LEFT JOIN ?", minutesAgo: 138 },
      { from: "other", body: "On le fait ensemble ce soir ?", minutesAgo: 126 },
      { from: "other", body: "19 h ?", minutesAgo: 124 },
      { from: "other", body: "Je réserve la salle de la bibliothèque", minutesAgo: 121 },
    ],
    6,
  );
  await talk(
    sarah,
    15,
    [
      {
        from: "grace",
        body: "Coucou Sarah, tu peux me raconter ton entretien chez Mwinda ?",
        minutesAgo: 3 * 24 * 60,
      },
      { from: "other", body: "Note vocale · 0:06", kind: "voice", minutesAgo: 3 * 24 * 60 - 40 },
    ],
    0,
  );

  // Grâce shares Patrick's card with Amani (planche Messages-ruth).
  const withAmani = await db.conversation.findFirst({
    where: {
      kind: "peer",
      participants: { some: { userId: amani.id } },
      AND: { participants: { some: { userId: grace.id } } },
    },
    select: { id: true },
  });
  if (withAmani) {
    const name = [patrick.firstName, patrick.lastName].filter(Boolean).join(" ");
    await db.message.deleteMany({ where: { conversationId: withAmani.id, kind: "contact" } });
    await db.message.create({
      data: {
        conversationId: withAmani.id,
        senderId: grace.id,
        kind: "contact",
        body: name,
        payload: { userId: patrick.id, name, line: "Analyste crédit · Fleuve Banque (fictive)" },
        createdAt: ago(2 * 24 * 60),
      },
    });
    await db.message.create({
      data: {
        conversationId: withAmani.id,
        senderId: amani.id,
        body: "Merci pour le contact !",
        createdAt: ago(2 * 24 * 60 - 30),
      },
    });
    await db.conversation.update({
      where: { id: withAmani.id },
      data: { lastMessageAt: ago(2 * 24 * 60 - 30) },
    });
    await db.conversationParticipant.updateMany({
      where: { conversationId: withAmani.id },
      data: { lastReadAt: ago(2 * 24 * 60 - 20) },
    });
  }

  // Fleuve Banque only acknowledged the application: a company, not a recruiter (« Entreprises »).
  const fleuve = await db.application.findFirst({
    where: {
      profile: { userId: grace.id },
      job: { slug: "ux-chargee-etudes-marketing-kinshasa" },
    },
    select: { id: true, job: { select: { organizationId: true } } },
  });
  if (fleuve) {
    const conversation = await db.conversation.upsert({
      where: { applicationId: fleuve.id },
      update: { lastMessageAt: ago(10 * 24 * 60) },
      create: {
        kind: "application",
        applicationId: fleuve.id,
        organizationId: fleuve.job.organizationId,
        talentUserId: grace.id,
        lastMessageAt: ago(10 * 24 * 60),
      },
    });
    await db.message.deleteMany({ where: { conversationId: conversation.id } });
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: null,
        kind: "system",
        body: "Votre candidature a bien été reçue. (message fictif)",
        createdAt: ago(10 * 24 * 60),
      },
    });
  }
}
