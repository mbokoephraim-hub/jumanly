import { describe, expect, it, vi } from "vitest";
import { hashWithLeakCheck, isCompromisedPasswordError } from "@/server/auth/password-check";

const plain = async (password: string) => `plain:${password}`;
const compromised = Object.assign(new Error("compromised"), {
  body: { code: "PASSWORD_COMPROMISED" },
});

describe("vérification des mots de passe divulgués", () => {
  it("garde le résultat de la vérification quand le service répond", async () => {
    const report = vi.fn();
    const hash = await hashWithLeakCheck("secret-2026", async (p) => `checked:${p}`, plain, {
      report,
    });
    expect(hash).toBe("checked:secret-2026");
    expect(report).not.toHaveBeenCalled();
  });

  it("refuse toujours un mot de passe divulgué", async () => {
    const check = hashWithLeakCheck("password123", () => Promise.reject(compromised), plain, {
      report: vi.fn(),
    });
    await expect(check).rejects.toBe(compromised);
    expect(isCompromisedPasswordError(compromised)).toBe(true);
  });

  it("n'empêche pas l'inscription quand le service est injoignable", async () => {
    const report = vi.fn();
    const failure = new Error("Failed to check password. Please try again later.");
    const hash = await hashWithLeakCheck("secret-2026", () => Promise.reject(failure), plain, {
      report,
    });
    expect(hash).toBe("plain:secret-2026");
    expect(report).toHaveBeenCalledWith(failure);
  });

  it("n'attend pas indéfiniment un service qui ne répond pas", async () => {
    const report = vi.fn();
    const hash = await hashWithLeakCheck("secret-2026", () => new Promise(() => {}), plain, {
      timeoutMs: 20,
      report,
    });
    expect(hash).toBe("plain:secret-2026");
    expect(report).toHaveBeenCalledOnce();
  });
});
