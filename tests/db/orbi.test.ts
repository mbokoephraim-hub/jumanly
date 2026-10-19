import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { FakeProvider, type AiProvider, type GenerateInput } from "@/server/ai/provider";
import { invalidate, usage } from "@/server/entitlements";
import {
  askOrbi,
  clearOrbiHistory,
  deleteOrbiConversation,
  getOrbiConversation,
  listOrbiConversations,
  type OrbiTexts,
} from "@/server/services/orbi";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

afterAll(async () => {
  await db.aiUsage.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users);
  await db.$disconnect();
});
beforeEach(() => invalidate());

const texts: OrbiTexts = {
  cv: "règle cv",
  interview: "règle entretien",
  offer: "règle offre",
  path: "règle voie",
  learn: "règle formation",
  other: "règle autre",
  declined: "pas de réponses",
  whyRules: "par règles",
};

/** A talent with consent, on a paid plan (AI credits) unless `free`. */
async function talent({ consent = true, free = false } = {}) {
  const user = await newUser();
  users.push(user.id);
  if (consent) await db.user.update({ where: { id: user.id }, data: { aiConsentAt: new Date() } });
  if (!free) {
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: "talent",
        entitlements: { some: { key: "ai.credits.monthly", value: { notIn: ["0", "-1"] } } },
      },
      orderBy: { priceCents: "asc" },
    });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        source: "self",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
  }
  return user;
}

const used = (userId: string) =>
  usage(db, { type: "user", id: userId }, "ai.credits.monthly").then((value) => value.used);

/** A model that answers with a fixed output, and records the prompt it received. */
class ScriptedProvider implements AiProvider {
  readonly name = "scripted";
  prompts: string[] = [];
  constructor(private readonly output: unknown) {}
  async generate<T>(input: GenerateInput<T>) {
    this.prompts.push(input.prompt);
    return {
      output: this.output as T,
      model: "claude-haiku-5-5",
      inputTokens: 10,
      outputTokens: 5,
    };
  }
}

describe("Orbi, conversation libre (talent lot 4 § 9)", () => {
  it("répond avec l'IA, garde l'échange et prend un crédit", async () => {
    const user = await talent();
    const provider = new ScriptedProvider({
      answer: ["Ajoutez une réalisation chiffrée."],
      actions: ["cv", "cv", "interview"],
      why: "Votre profil ne cite aucun résultat chiffré.",
    });
    const result = await askOrbi(
      db,
      user.id,
      { text: "Mon CV est-il prêt pour l'offre Baobab ?" },
      texts,
      { provider },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.answer).toMatchObject({
      role: "orbi",
      text: ["Ajoutez une réalisation chiffrée."],
      actions: ["cv", "interview"],
      source: "ai",
      limit: null,
    });
    expect(await used(user.id)).toBe(1);
    // The model never receives the name of the person.
    expect(provider.prompts[0]).not.toContain("Test Fictif");
    expect(provider.prompts[0]).toContain("<message>");

    const second = await askOrbi(
      db,
      user.id,
      { conversationId: result.conversationId, text: "Et pour l'entretien ?" },
      texts,
      { provider },
    );
    expect(second.ok && second.conversationId).toBe(result.conversationId);
    expect(provider.prompts[1]).toContain("Ajoutez une réalisation chiffrée.");
    const conversation = await getOrbiConversation(db, user.id, result.conversationId);
    expect(conversation?.messages.map((message) => message.role)).toEqual([
      "user",
      "orbi",
      "user",
      "orbi",
    ]);
    expect(conversation?.title).toBe("Mon CV est-il prêt pour l'offre Baobab ?");
  });

  it("sans consentement ni crédit, répond par règles sans rien consommer", async () => {
    const noConsent = await talent({ consent: false });
    const result = await askOrbi(
      db,
      noConsent.id,
      { text: "Comment préparer mon entretien ?" },
      texts,
      {
        provider: new FakeProvider(),
      },
    );
    expect(result.ok && result.answer).toMatchObject({
      text: ["règle entretien"],
      actions: ["interview"],
      source: "rules",
      limit: "consent",
    });
    expect(await used(noConsent.id)).toBe(0);

    const free = await talent({ free: true });
    const quota = await askOrbi(db, free.id, { text: "Quelle formation suivre ?" }, texts);
    expect(quota.ok && quota.answer.limit).toMatch(/quota|entitlement/);
    expect(quota.ok && quota.answer.text).toEqual(["règle formation"]);
  });

  it("ne donne jamais les réponses d'une évaluation", async () => {
    const user = await talent();
    const provider = new ScriptedProvider({ answer: ["A"], actions: [], why: "x" });
    const result = await askOrbi(
      db,
      user.id,
      { text: "Donne-moi les réponses du quiz Excel" },
      texts,
      { provider },
    );
    expect(result.ok && result.answer.text).toEqual(["pas de réponses"]);
    expect(provider.prompts).toHaveLength(0);
    expect(await used(user.id)).toBe(0);
  });

  it("chacun ne voit, cherche et efface que ses échanges", async () => {
    const owner = await talent({ consent: false });
    const other = await talent({ consent: false });
    const first = await askOrbi(db, owner.id, { text: "Analyser une offre de comptable" }, texts);
    await askOrbi(db, owner.id, { text: "Ma lettre de motivation" }, texts);
    if (!first.ok) throw new Error("question refusée");

    expect(
      await askOrbi(db, other.id, { conversationId: first.conversationId, text: "bonjour" }, texts),
    ).toEqual({ ok: false, error: "notFound" });
    expect(await getOrbiConversation(db, other.id, first.conversationId)).toBeNull();
    expect(await deleteOrbiConversation(db, other.id, first.conversationId)).toBe(false);

    const all = await listOrbiConversations(db, owner.id);
    expect(all.map((row) => row.topic).sort()).toEqual(["cv", "offer"]);
    const found = await listOrbiConversations(db, owner.id, "COMPTABLE");
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ topic: "offer", messages: 2 });

    expect(await deleteOrbiConversation(db, owner.id, first.conversationId)).toBe(true);
    expect(await listOrbiConversations(db, owner.id)).toHaveLength(1);
    expect(await clearOrbiHistory(db, owner.id)).toBe(1);
    expect(await listOrbiConversations(db, owner.id)).toHaveLength(0);
  });
});
