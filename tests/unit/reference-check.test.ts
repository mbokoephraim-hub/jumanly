import { describe, expect, it } from "vitest";
import { hashToken, referenceState, referentSchema } from "@/server/services/reference-check";

const now = new Date("2026-10-29T12:00:00Z");
const row = (
  status: "pending" | "confirmed" | "declined" | "cancelled",
  extra: Partial<{ expiresAt: Date; createdAt: Date }> = {},
) => ({
  id: status,
  status,
  referentName: "Référent fictif",
  createdAt: extra.createdAt ?? new Date("2026-10-20T12:00:00Z"),
  respondedAt: status === "pending" ? null : new Date("2026-10-21T12:00:00Z"),
  expiresAt: extra.expiresAt ?? new Date("2026-11-19T12:00:00Z"),
});

describe("référent : état d'un élément", () => {
  it("aucune demande, aucun état", () => {
    expect(referenceState([], now)).toBeNull();
    expect(referenceState(undefined, now)).toBeNull();
  });

  it("une confirmation l'emporte sur tout le reste", () => {
    expect(referenceState([row("declined"), row("confirmed"), row("pending")], now)?.status).toBe(
      "confirmed",
    );
  });

  it("une demande expirée ne compte plus", () => {
    const expired = row("pending", { expiresAt: new Date("2026-10-28T12:00:00Z") });
    expect(referenceState([expired], now)).toBeNull();
    expect(referenceState([expired, row("declined")], now)?.status).toBe("declined");
  });

  it("une demande en cours est en attente", () => {
    expect(referenceState([row("pending")], now)?.status).toBe("pending");
  });
});

describe("référent : saisie", () => {
  it("met l'adresse en minuscules et refuse une adresse invalide", () => {
    expect(referentSchema.parse({ name: "Ama Test", email: " Ama@Exemple.TEST " }).email).toBe(
      "ama@exemple.test",
    );
    expect(referentSchema.safeParse({ name: "Ama Test", email: "pas-une-adresse" }).success).toBe(
      false,
    );
  });

  it("ne garde que l'empreinte du jeton", () => {
    expect(hashToken("abc")).toHaveLength(64);
    expect(hashToken("abc")).not.toContain("abc");
  });
});
