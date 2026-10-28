/**
 * Modèle B recruteur, M7: Messages of the phone. The lists of an organization never show another
 * organization's conversations (golden rule 6); a conversation of the team is read and written by
 * its two members only, never by a third colleague, another organization or a talent; a colleague
 * who left can be read, no longer answered.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MembershipRole } from "@/generated/prisma/client";
import { invalidate } from "@/server/entitlements";
import { applyToJob } from "@/server/services/applications";
import {
  ensureApplicationConversation,
  listConversations,
  sendMessage,
} from "@/server/services/connect";
import { HireError, type HireContext } from "@/server/services/hire";
import {
  newMessageChoices,
  openTeamThread,
  relationThread,
  rhMessages,
  sendTeamMessage,
  teamThread,
} from "@/server/services/hire-phone-messages";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];
const day = 86_400_000;

afterAll(async () => {
  await db.job.deleteMany({ where: { organizationId: { in: orgs } } });
  await cleanup(users, orgs);
  await db.$disconnect();
});
beforeEach(() => invalidate());

async function member(organizationId: string, role: MembershipRole): Promise<HireContext> {
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({ data: { userId: user.id, organizationId, role } });
  return { userId: user.id, organizationId, role };
}

async function company() {
  const organization = await newOrganization("company");
  orgs.push(organization.id);
  return member(organization.id, "org_owner");
}

/** A published offer of the organization, and one talent who applied and wrote. */
async function applicationOf(ctx: HireContext) {
  const job = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
      slug: `test-${randomUUID()}`,
      title: "Analyste fictif",
      description: "Poste fictif pour les tests.",
      contractType: "cdi",
      city: "Kinshasa",
      country: "RD Congo",
      remote: "onsite",
      status: "published",
      publishedAt: new Date(),
      closesAt: new Date(Date.now() + 30 * day),
    },
  });
  const talent = await newUser();
  users.push(talent.id);
  const applied = await applyToJob(db, { userId: talent.id, jobSlug: job.slug });
  if (applied.status !== "applied") throw new Error(applied.status);
  const conversation = await ensureApplicationConversation(db, applied.applicationId);
  await sendMessage(db, { userId: talent.id }, conversation.id, {
    body: "Bonjour, message fictif.",
  });
  return { talentId: talent.id, conversationId: conversation.id };
}

describe("Messages du recruteur au téléphone (M7)", () => {
  let a: HireContext;
  let colleague: HireContext;
  let third: HireContext;
  let b: HireContext;
  let fromA: { talentId: string; conversationId: string };
  let fromB: { talentId: string; conversationId: string };

  beforeAll(async () => {
    a = await company();
    colleague = await member(a.organizationId, "recruiter");
    third = await member(a.organizationId, "recruiter");
    b = await company();
    fromA = await applicationOf(a);
    fromB = await applicationOf(b);
  });

  it("n'affiche que les conversations de l'organisation (règle d'or n° 6)", async () => {
    const rowsA = await rhMessages(db, a);
    const rowsB = await rhMessages(db, b);
    expect(rowsA.map((row) => row.id)).toContain(fromA.conversationId);
    expect(rowsA.map((row) => row.id)).not.toContain(fromB.conversationId);
    expect(rowsB.map((row) => row.id)).not.toContain(fromA.conversationId);
    const row = rowsA.find((item) => item.id === fromA.conversationId)!;
    expect(row.tab).toBe("candidats");
    expect(row.waiting).toBe(true);
    const choices = await newMessageChoices(db, a);
    expect(choices.members.map((item) => item.id).sort()).toEqual(
      [colleague.userId, third.userId].sort(),
    );
    expect(choices.members.map((item) => item.id)).not.toContain(b.userId);
  });

  it("ouvre une conversation d'équipe avec un collègue, jamais avec soi ou une autre entreprise", async () => {
    await expect(openTeamThread(db, a, a.userId)).rejects.toBeInstanceOf(HireError);
    await expect(openTeamThread(db, a, b.userId)).rejects.toBeInstanceOf(HireError);
    const id = await openTeamThread(db, a, colleague.userId);
    expect(await openTeamThread(db, colleague, a.userId)).toBe(id);
    // Not written yet: not in the lists.
    expect((await rhMessages(db, a)).some((row) => row.id === id)).toBe(false);
  });

  it("seuls les deux membres lisent et écrivent ; le collègue est prévenu", async () => {
    const id = await openTeamThread(db, a, colleague.userId);
    await sendTeamMessage(db, a, id, "  Tu peux relire l'offre fictive ?  ", "Membre fictif");
    const read = await teamThread(db, colleague, id);
    expect(read.messages).toEqual([
      expect.objectContaining({ mine: false, body: "Tu peux relire l'offre fictive ?" }),
    ]);
    expect(read.other.id).toBe(a.userId);
    const notification = await db.notification.findFirst({
      where: { userId: colleague.userId, type: "teamMessage" },
    });
    expect(notification?.href).toBe(`/app/messages/equipe/${id}`);

    // A third colleague, another organization, even with the thread's id: nothing.
    await expect(teamThread(db, third, id)).rejects.toBeInstanceOf(HireError);
    await expect(sendTeamMessage(db, third, id, "Intrus", "X")).rejects.toBeInstanceOf(HireError);
    await expect(teamThread(db, { ...b, userId: a.userId }, id)).rejects.toBeInstanceOf(HireError);
    expect((await rhMessages(db, third)).some((row) => row.id === id)).toBe(false);
    expect((await rhMessages(db, b)).some((row) => row.id === id)).toBe(false);

    // In the colleague's « Équipe », unread until opened.
    const row = (await rhMessages(db, colleague)).find((item) => item.id === id);
    expect(row?.tab).toBe("equipe");
    await expect(sendTeamMessage(db, a, id, "   ", "X")).rejects.toMatchObject({ code: "invalid" });
  });

  it("un talent ne voit jamais les conversations de l'équipe", async () => {
    const conversations = await listConversations(db, { userId: fromA.talentId });
    const ids = conversations.map((item: { id: string }) => item.id);
    const team = await db.teamThread.findMany({ where: { organizationId: a.organizationId } });
    expect(team.length).toBeGreaterThan(0);
    for (const thread of team) expect(ids).not.toContain(thread.id);
    // A conversation of the organization is never read as a relation of the member.
    await expect(relationThread(db, a.userId, fromA.conversationId)).rejects.toBeTruthy();
  });

  it("un collègue parti se lit encore, mais ne reçoit plus de message", async () => {
    const id = await openTeamThread(db, a, third.userId);
    await sendTeamMessage(db, third, id, "Je pars bientôt, message fictif.", "Membre fictif");
    await db.membership.updateMany({
      where: { userId: third.userId, organizationId: a.organizationId },
      data: { status: "removed" },
    });
    const read = await teamThread(db, a, id);
    expect(read.other.left).toBe(true);
    expect(read.messages).toHaveLength(1);
    await expect(sendTeamMessage(db, a, id, "Encore là ?", "X")).rejects.toBeInstanceOf(HireError);
  });
});
