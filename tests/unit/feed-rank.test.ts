import { describe, expect, it } from "vitest";
import {
  type AuthorSignals,
  postScore,
  professionalText,
  rankFeed,
  type RankPost,
} from "@/server/services/feed-rank";

// « Pour vous » (Ephraïm, 22/10/2026): professional first, without hiding the rest.
const now = new Date("2026-10-22T12:00:00Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);
const quiet: AuthorSignals = { replies: 0, activeDays: 0, connections: 0, hiredHere: false };

function post(id: string, patch: Partial<RankPost> = {}): RankPost {
  return {
    id,
    kind: "post",
    body: "Belle journée à tous",
    createdAt: hoursAgo(1),
    authorId: `auteur-${id}`,
    organizationId: null,
    hasJob: false,
    likes: 0,
    replies: 0,
    reposts: 0,
    ...patch,
  };
}

describe("Classement de « Pour vous »", () => {
  it("met une opportunité devant une publication ordinaire du même moment", () => {
    const ranked = rankFeed([post("a"), post("b", { hasJob: true })], new Map(), "moi", now);
    expect(ranked.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("met en avant le nouveau poste obtenu grâce à Jumanly", () => {
    const authors = new Map([
      ["auteur-a", quiet],
      ["auteur-b", { ...quiet, hiredHere: true }],
    ]);
    const a = postScore(post("a", { kind: "newRole" }), authors.get("auteur-a"), now);
    const b = postScore(post("b", { kind: "newRole" }), authors.get("auteur-b"), now);
    expect(b).toBeGreaterThan(a);
  });

  it("favorise qui commente, revient souvent et se connecte aux autres", () => {
    const active: AuthorSignals = { replies: 6, activeDays: 20, connections: 40, hiredHere: false };
    expect(postScore(post("a"), active, now)).toBeGreaterThan(postScore(post("a"), quiet, now));
  });

  it("événements, attestations, réalisations et mots du travail comptent aussi", () => {
    const plain = postScore(post("a"), quiet, now);
    for (const kind of ["event", "certificate", "work"] as const)
      expect(postScore(post("a", { kind }), quiet, now)).toBeGreaterThan(plain);
    expect(
      postScore(post("a", { body: "Je cherche un stage en comptabilité" }), quiet, now),
    ).toBeGreaterThan(plain);
    expect(professionalText("Nouvelle Opportunité à Kinshasa")).toBe(true);
    expect(professionalText("Joyeux anniversaire")).toBe(false);
  });

  it("ne cache pas tout le reste : le récent passe devant une vieille offre", () => {
    const ranked = rankFeed(
      [post("vieille", { hasJob: true, createdAt: hoursAgo(96) }), post("recente")],
      new Map(),
      "moi",
      now,
    );
    expect(ranked[0].id).toBe("recente");
  });

  it("garde en tête ce que je viens de publier", () => {
    const mine = post("mien", { authorId: "moi", createdAt: hoursAgo(0.05) });
    const ranked = rankFeed([post("offre", { hasJob: true }), mine], new Map(), "moi", now);
    expect(ranked[0].id).toBe("mien");
  });

  it("varie les auteurs en haut du Fil", () => {
    const same = [1, 2, 3].map((n) =>
      post(`x${n}`, { authorId: "bavard", hasJob: true, createdAt: hoursAgo(n / 10) }),
    );
    const ranked = rankFeed([...same, post("autre", { kind: "event" })], new Map(), "moi", now);
    expect(ranked.findIndex((item) => item.id === "autre")).toBeLessThan(3);
  });

  it("donne toujours le même ordre", () => {
    const posts = [post("a"), post("b"), post("c", { kind: "event" })];
    const one = rankFeed(posts, new Map(), "moi", now).map((item) => item.id);
    const two = rankFeed([...posts].reverse(), new Map(), "moi", now).map((item) => item.id);
    expect(one).toEqual(two);
  });
});
