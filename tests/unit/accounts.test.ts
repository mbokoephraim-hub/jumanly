import { describe, expect, it } from "vitest";
import { passwordProblem, passwordStrength } from "@/lib/password";
import { parseLimit } from "@/server/entitlements";
import {
  addMonths,
  effectiveStatus,
  GRACE_DAYS,
  periodAround,
} from "@/server/entitlements/periods";
import { FakePaymentProvider } from "@/server/payments/fake";
import { familiesForProfile, signupAccountSchema, splitFullName } from "@/server/services/accounts";
import { maskNumber } from "@/server/services/subscriptions";

const day = 86_400_000;
const utc = (value: string) => new Date(`${value}T00:00:00Z`);

describe("mot de passe", () => {
  it("exige 10 caractères, une lettre et un chiffre", () => {
    expect(passwordProblem("court1")).toBe("passwordTooShort");
    expect(passwordProblem("seulementdeslettres")).toBe("passwordWeak");
    expect(passwordProblem("1234567890")).toBe("passwordWeak");
    expect(passwordProblem("kinshasa2026")).toBeNull();
  });
  it("évalue la robustesse", () => {
    expect(passwordStrength("kinshasa2026")).toBe("medium");
    expect(passwordStrength("Kinshasa-2026-Gombe")).toBe("strong");
  });
});

describe("inscription", () => {
  const valid = {
    profile: "talent",
    firstName: "Amani",
    lastName: "Fictif",
    email: " Amani@Exemple.COM ",
    password: "kinshasa2026",
    country: "CD",
    city: "Kinshasa",
    terms: "on",
    ai: "on",
    age: "on",
  };
  it("accepte un talent et normalise l'e-mail", () => {
    const parsed = signupAccountSchema.parse(valid);
    expect(parsed.email).toBe("amani@exemple.com");
  });
  it("exige d'accepter les conditions", () => {
    const result = signupAccountSchema.safeParse({ ...valid, terms: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain("termsRequired");
  });
  it("demande le pays et la ville à une organisation, pas à un talent (refonte mobile)", () => {
    const talent = signupAccountSchema.safeParse({ ...valid, country: undefined, city: undefined });
    expect(talent.success).toBe(true);
    const org = signupAccountSchema.safeParse({
      ...valid,
      profile: "rh",
      orgName: "Cabinet fictif",
      country: undefined,
      city: undefined,
    });
    expect(org.error?.issues.map((issue) => issue.message)).toEqual([
      "countryRequired",
      "cityRequired",
    ]);
  });
  it("sépare le prénom du nom saisis dans un seul champ", () => {
    expect(splitFullName("  Grâce   Mbuyi Kanku ")).toEqual({
      firstName: "Grâce",
      lastName: "Mbuyi Kanku",
    });
    expect(splitFullName("Grâce")).toEqual({ firstName: "Grâce", lastName: "" });
  });
  it("exige le nom de l'organisation pour un recruteur", () => {
    const result = signupAccountSchema.safeParse({ ...valid, profile: "rh" });
    expect(result.error?.issues[0]?.message).toBe("orgNameRequired");
  });
  it("propose les bonnes familles de forfaits", () => {
    expect(familiesForProfile("talent")).toEqual(["talent"]);
    expect(familiesForProfile("company")).toEqual(["rh", "company"]);
    expect(familiesForProfile("partner")).toEqual([]);
  });
});

describe("périodes d'abonnement", () => {
  it("ajoute un mois en restant dans le mois suivant", () => {
    expect(addMonths(utc("2026-01-31"), 1)).toEqual(utc("2026-02-28"));
    expect(addMonths(utc("2028-01-31"), 1)).toEqual(utc("2028-02-29"));
    expect(addMonths(utc("2026-10-13"), 1)).toEqual(utc("2026-11-13"));
  });
  it("trouve le mois glissant qui contient la date", () => {
    expect(periodAround(utc("2026-01-15"), utc("2026-03-20"))).toEqual({
      start: utc("2026-03-15"),
      end: utc("2026-04-15"),
    });
    expect(periodAround(utc("2026-01-15"), utc("2026-03-10"))).toEqual({
      start: utc("2026-02-15"),
      end: utc("2026-03-15"),
    });
  });
  it("passe en délai de grâce puis expire", () => {
    const end = utc("2026-05-01");
    const sub = { status: "active" as const, currentPeriodEnd: end };
    expect(effectiveStatus(sub, new Date(end.getTime() - day))).toBe("active");
    expect(effectiveStatus(sub, new Date(end.getTime() + day))).toBe("past_due");
    expect(effectiveStatus(sub, new Date(end.getTime() + GRACE_DAYS * day))).toBe("expired");
    expect(
      effectiveStatus({ status: "canceled", currentPeriodEnd: end }, new Date(end.getTime() + 1)),
    ).toBe("expired");
    expect(
      effectiveStatus({ status: "trialing", currentPeriodEnd: end }, new Date(end.getTime() - 1)),
    ).toBe("trialing");
  });
});

describe("limites", () => {
  it("lit -1 comme illimité, 0 et « contract » comme aucun", () => {
    expect(parseLimit("-1")).toBe(-1);
    expect(parseLimit("150")).toBe(150);
    expect(parseLimit("contract")).toBe(0);
    expect(parseLimit(undefined)).toBe(0);
    expect(parseLimit("abc")).toBe(0);
  });
});

describe("paiement factice", () => {
  const provider = new FakePaymentProvider();
  const pay = (msisdn?: string, method: "mobile_money" | "card" = "mobile_money") =>
    provider.createPayment({
      amountCents: 990,
      currency: "USD",
      reference: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      method,
      customer: { email: "a@exemple.test", msisdn, country: "CD" },
      returnUrl: "http://localhost/",
    });
  it("simule chaque issue selon le numéro", async () => {
    expect(await provider.getStatus((await pay("0990001234")).providerRef)).toBe("succeeded");
    expect(await provider.getStatus((await pay("0990000000")).providerRef)).toBe("failed");
    expect(await provider.getStatus((await pay("0990001111")).providerRef)).toBe("expired");
    expect(await provider.getStatus((await pay("0990002222")).providerRef)).toBe("pending");
    expect(await provider.getStatus((await pay(undefined, "card")).providerRef)).toBe("succeeded");
    expect(await provider.getStatus("fake_inconnu")).toBe("expired");
  });
  it("masque le numéro", () => {
    expect(maskNumber("+243 990 001 234")).toBe("••••••1234");
  });
});
