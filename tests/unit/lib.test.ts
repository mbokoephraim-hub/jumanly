import { afterEach, describe, expect, it, vi } from "vitest";
import { splitLastNumber } from "@/lib/numbers";
import { appEnv, isInternalEnv } from "@/lib/env";
import { formatUsd } from "@/lib/money";

describe("formatUsd", () => {
  it("affiche les montants en centimes USD à la française", () => {
    expect(formatUsd(990)).toBe("9,9");
    expect(formatUsd(1995)).toBe("19,95");
    expect(formatUsd(1500)).toBe("15");
    expect(formatUsd(0)).toBe("0");
  });
});

describe("environnements", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("considère une variable absente comme le développement local", () => {
    vi.stubEnv("APP_ENV", "");
    expect(appEnv()).toBe("local");
    expect(isInternalEnv()).toBe(true);
  });

  it("réserve les pages internes au local et aux previews", () => {
    vi.stubEnv("APP_ENV", "preview");
    expect(isInternalEnv()).toBe(true);
    vi.stubEnv("APP_ENV", "staging");
    expect(isInternalEnv()).toBe(false);
    vi.stubEnv("APP_ENV", "production");
    expect(isInternalEnv()).toBe(false);
  });
});

describe("splitLastNumber (compteurs de la page d'accueil)", () => {
  it("isole le dernier nombre d'un texte", () => {
    expect(splitLastNumber("87 % compatible · Pourquoi ?")).toMatchObject({
      before: "",
      number: "87",
      after: " % compatible · Pourquoi ?",
      value: 87,
      decimals: 0,
    });
    expect(splitLastNumber("De 0 à 49,9 USD/mois")).toMatchObject({
      before: "De 0 à ",
      number: "49,9",
      value: 49.9,
      decimals: 1,
    });
    expect(splitLastNumber("À partir de 1 200 USD/mois")?.value).toBe(1200);
  });

  it("laisse un texte sans nombre tel quel", () => {
    expect(splitLastNumber("Sur contrat")).toBeNull();
  });
});
