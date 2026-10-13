import { afterEach, describe, expect, it, vi } from "vitest";
import { appEnv, isInternalEnv } from "@/lib/env";
import { formatUsd } from "@/lib/money";

describe("formatUsd", () => {
  it("affiche les montants en centimes USD à la française", () => {
    expect(formatUsd(990)).toBe("9,90");
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
