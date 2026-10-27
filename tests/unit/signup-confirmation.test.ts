import { describe, expect, it } from "vitest";
import { confirmationCallback } from "@/server/services/signup-confirmation";

// Sign-up confirmed by a link (decision of 2026-10-27): where the link of the e-mail leads.
describe("confirmationCallback", () => {
  it("mène à /inscription/confirmee sans rien d'autre par défaut", () => {
    expect(confirmationCallback()).toBe("/inscription/confirmee");
  });

  it("garde le forfait choisi et l'action interrompue", () => {
    expect(confirmationCallback({ plan: "talent_pro", next: "/offres/analyste?postuler=1" })).toBe(
      "/inscription/confirmee?forfait=talent_pro&suite=%2Foffres%2Fanalyste%3Fpostuler%3D1",
    );
  });
});
