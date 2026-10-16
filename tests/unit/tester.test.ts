import { describe, expect, it } from "vitest";
import { isTester } from "@/server/services/tester";

describe("compte passe-partout (TESTER_EMAILS)", () => {
  const user = { email: "Owner@Example.com", emailVerified: true };

  it("ne reconnaît qu'une adresse listée et vérifiée", () => {
    expect(isTester(user, " owner@example.com , x@y.io")).toBe(true);
    expect(isTester({ ...user, emailVerified: false }, "owner@example.com")).toBe(false);
    expect(isTester(user, "autre@example.com")).toBe(false);
    expect(isTester(user, "")).toBe(false);
    expect(isTester(user, undefined)).toBe(false);
  });
});
