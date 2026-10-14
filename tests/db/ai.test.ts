import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { AiError, aiFeatures, runAi } from "@/server/ai";
import { AiUnavailableError, FakeProvider, type AiProvider } from "@/server/ai/provider";
import { invalidate, usage } from "@/server/entitlements";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

afterAll(async () => {
  await db.aiUsage.deleteMany({ where: { userId: { in: users } } });
  await cleanup(users);
  await db.$disconnect();
});
beforeEach(() => invalidate());

/** A talent on the plan that gives `credits` AI credits a month (chosen by entitlement). */
async function talent({ consent = true, credits }: { consent?: boolean; credits?: string } = {}) {
  const user = await newUser();
  users.push(user.id);
  if (consent) await db.user.update({ where: { id: user.id }, data: { aiConsentAt: new Date() } });
  if (credits) {
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: "talent",
        entitlements: { some: { key: "ai.credits.monthly", value: credits } },
      },
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

async function paidCredits() {
  const plans = await db.planEntitlement.findMany({
    where: { key: "ai.credits.monthly", plan: { family: "talent" } },
    select: { value: true },
  });
  const value = plans.map((row) => Number(row.value)).find((value) => value > 0);
  expect(value).toBeDefined();
  return String(value);
}

const schema = z.object({ text: z.string() });
const call = (userId: string, provider: AiProvider = new FakeProvider()) =>
  runAi(
    db,
    {
      userId,
      feature: "cv_coach",
      system: "test",
      prompt: "test",
      schema,
      template: () => ({ text: "modèle" }),
    },
    { provider },
  );
const credits = (userId: string) =>
  usage(db, { type: "user", id: userId }, "ai.credits.monthly").then((value) => value.used);
const logs = (userId: string) => db.aiUsage.findMany({ where: { userId } });

describe("couche IA (partie 08 § 8.9)", () => {
  it("aucun appel sans consentement", async () => {
    const user = await talent({ consent: false, credits: await paidCredits() });
    await expect(call(user.id)).rejects.toMatchObject({ code: "consent" });
    expect(await logs(user.id)).toHaveLength(0);
    expect(await credits(user.id)).toBe(0);
  });

  it("aucun appel sans crédits (forfait gratuit)", async () => {
    const user = await talent();
    await expect(call(user.id)).rejects.toBeInstanceOf(AiError);
    await expect(call(user.id)).rejects.toMatchObject({ code: "quota" });
    expect(await logs(user.id)).toHaveLength(0);
  });

  it("aucun appel sans le droit demandé", async () => {
    const user = await talent({ credits: await paidCredits() });
    await expect(
      runAi(
        db,
        {
          userId: user.id,
          feature: "diagnostic",
          gate: { key: "career.diagnostic.level", levels: ["inexistant"] },
          system: "",
          prompt: "",
          schema,
          template: () => ({ text: "" }),
        },
        { provider: new FakeProvider() },
      ),
    ).rejects.toMatchObject({ code: "entitlement" });
  });

  it("un appel réussi utilise ses crédits et est journalisé avec le forfait", async () => {
    const user = await talent({ credits: await paidCredits() });
    const result = await call(user.id);
    expect(result.output.text).toBe("modèle");
    expect(await credits(user.id)).toBe(aiFeatures.cv_coach.credits);
    const [log] = await logs(user.id);
    expect(log).toMatchObject({ feature: "cv_coach", status: "ok", model: "fake" });
    expect(log!.planCode).toBeTruthy();
  });

  it("une sortie rejetée retombe sur le modèle de texte, sans crédit", async () => {
    const user = await talent({ credits: await paidCredits() });
    const invalid: AiProvider = {
      name: "test",
      generate: async () => ({ output: null, model: "test", inputTokens: 10, outputTokens: 5 }),
    };
    const result = await call(user.id, invalid);
    expect(result).toEqual({ output: { text: "modèle" }, source: "template" });
    expect(await credits(user.id)).toBe(0);
    expect((await logs(user.id))[0]).toMatchObject({ status: "invalid", inputTokens: 10 });
  });

  it("un service indisponible ne coûte aucun crédit", async () => {
    const user = await talent({ credits: await paidCredits() });
    const down: AiProvider = {
      name: "test",
      generate: async () => {
        throw new AiUnavailableError();
      },
    };
    await expect(call(user.id, down)).rejects.toMatchObject({ code: "unavailable" });
    expect(await credits(user.id)).toBe(0);
    expect((await logs(user.id))[0]).toMatchObject({ status: "error" });
  });
});
