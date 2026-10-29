/**
 * « Connexions » of the Chat (Ephraïm 29/10/2026): the requests received and sent, my
 * connections, and the people I may know, those connected to my connections first, then those
 * who share my skills. Suggestions only propose: nobody is asked without a touch, and no
 * connection data is used for matching (CLAUDE.md § 3 and 4).
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { findablePeopleWhere } from "./explore";
import { personSelect, type InboxPerson } from "./messages-phone";

/** At most this many suggestions on the page. */
export const SUGGESTIONS_MAX = 12;

export type HubSuggestion = {
  person: InboxPerson;
  /** My connections who are connected to this person, the closest first. */
  mutual: string[];
  /** « mutual »: through my connections; « field »: we share skills. */
  reason: "mutual" | "field";
};

/**
 * The people connected to each person of `circle`, and the reverse: who of my circle each
 * other person knows. A single read of the links of my connections.
 */
async function secondCircle(db: PrismaClient, circle: Set<string>, userId: string) {
  const through = new Map<string, Set<string>>();
  if (circle.size === 0) return through;
  const ids = [...circle];
  const rows = await db.connection.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: { in: ids } }, { addresseeId: { in: ids } }],
    },
    select: { requesterId: true, addresseeId: true },
    take: 5000,
  });
  const add = (mine: string, other: string) => {
    if (other === userId || !circle.has(mine)) return;
    const set = through.get(other) ?? new Set<string>();
    set.add(mine);
    through.set(other, set);
  };
  for (const row of rows) {
    add(row.requesterId, row.addresseeId);
    add(row.addresseeId, row.requesterId);
  }
  return through;
}

/** Everything the « Connexions » page shows, read at once. */
export async function connectionsHub(db: PrismaClient, userId: string) {
  const links = await db.connection.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      respondedAt: true,
      requesterId: true,
      addresseeId: true,
      requester: { select: personSelect },
      addressee: { select: personSelect },
      conversation: { select: { id: true } },
    },
  });
  const otherOf = (row: (typeof links)[number]) =>
    row.requesterId === userId ? row.addressee : row.requester;
  const accepted = links
    .filter((row) => row.status === "accepted")
    .sort((a, b) => (b.respondedAt?.getTime() ?? 0) - (a.respondedAt?.getTime() ?? 0));
  const circle = new Set(accepted.map((row) => otherOf(row).id));
  const people = new Map(accepted.map((row) => [otherOf(row).id, otherOf(row)]));
  const through = await secondCircle(db, circle, userId);
  const mutualOf = (id: string) => [...(through.get(id) ?? [])];

  // Anyone already linked to me (asked, connected, ignored, removed or blocked) is never proposed.
  const excluded = new Set([userId, ...links.map((row) => otherOf(row).id)]);
  const ranked = [...through.entries()]
    .filter(([id]) => !excluded.has(id))
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, SUGGESTIONS_MAX * 2)
    .map(([id]) => id);
  const found = ranked.length
    ? await db.user.findMany({
        where: { id: { in: ranked }, ...findablePeopleWhere },
        select: personSelect,
      })
    : [];
  const byId = new Map(found.map((row) => [row.id, row]));
  const suggestions: HubSuggestion[] = ranked
    .flatMap((id) => {
      const person = byId.get(id);
      return person ? [{ person, mutual: mutualOf(id), reason: "mutual" as const }] : [];
    })
    .slice(0, SUGGESTIONS_MAX);

  // Few people through my connections: those who share my skills, the most recently seen first.
  if (suggestions.length < SUGGESTIONS_MAX / 2) {
    const skills = await db.profileSkill.findMany({
      where: { profile: { userId } },
      select: { skillId: true },
      take: 30,
    });
    if (skills.length) {
      const taken = [...excluded, ...suggestions.map((item) => item.person.id)];
      const near = await db.user.findMany({
        where: {
          id: { notIn: taken },
          ...findablePeopleWhere,
          talentProfile: {
            is: { skills: { some: { skillId: { in: skills.map((row) => row.skillId) } } } },
          },
        },
        orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
        take: SUGGESTIONS_MAX - suggestions.length,
        select: personSelect,
      });
      for (const person of near) suggestions.push({ person, mutual: [], reason: "field" });
    }
  }

  return {
    received: links
      .filter((row) => row.status === "pending" && row.addresseeId === userId)
      .map((row) => ({
        id: row.id,
        note: row.note,
        at: row.createdAt,
        person: row.requester,
        mutual: mutualOf(row.requesterId),
      })),
    sent: links
      .filter((row) => row.status === "pending" && row.requesterId === userId)
      .map((row) => ({ id: row.id, at: row.createdAt, person: row.addressee })),
    connections: accepted.map((row) => ({
      connectionId: row.id,
      conversationId: row.conversation?.id ?? null,
      since: row.respondedAt ?? row.createdAt,
      person: otherOf(row),
      mutual: mutualOf(otherOf(row).id),
    })),
    suggestions,
    /** My connections by id, to draw the faces of « en commun ». */
    people,
  };
}
