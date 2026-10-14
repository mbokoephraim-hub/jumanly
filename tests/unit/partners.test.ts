/** E9 · Jumanly Partners: codes, masking, the anonymity threshold and the e-mail list parser. */
import { describe, expect, it } from "vitest";
import {
  batchStatus,
  cell,
  formatCode,
  licenseEnd,
  maskEmail,
  newCode,
  normalizeCode,
  parseInviteList,
} from "@/server/services/partners";

const day = 86_400_000;

describe("Codes de licence", () => {
  it("un code a le préfixe JMLY, 8 caractères sans 0, O, 1, I ni L", () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^JMLY[A-HJKMNP-Z2-9]{8}$/);
  });

  it("majuscules, tirets, espaces et préfixe ne comptent pas", () => {
    expect(normalizeCode("jmly-abcd-2345")).toBe("JMLYABCD2345");
    expect(normalizeCode(" abcd 2345 ")).toBe("JMLYABCD2345");
    expect(formatCode("JMLYABCD2345")).toBe("JMLY-ABCD-2345");
  });

  it("l'adresse d'une invitation est masquée", () => {
    expect(maskEmail("amani.fictif@jumanly.test")).toBe("a***@jumanly.test");
  });
});

describe("Seuil d'anonymat", () => {
  it("une cellule sur moins de 10 personnes est masquée, même si le lot demande moins", () => {
    expect(cell(25, 9, 10)).toEqual({ value: null, hidden: true });
    expect(cell(25, 9, 5)).toEqual({ value: null, hidden: true });
    expect(cell(25, 10, 10)).toEqual({ value: 25, hidden: false });
    expect(cell(25, 12, 15)).toEqual({ value: null, hidden: true });
  });
});

describe("Lots", () => {
  it("statut d'un lot", () => {
    const now = new Date();
    const batch = {
      startsAt: new Date(now.getTime() - day),
      endsAt: new Date(now.getTime() + day),
    };
    expect(batchStatus(batch, 3, now)).toBe("active");
    expect(batchStatus(batch, 0, now)).toBe("exhausted");
    expect(batchStatus({ ...batch, startsAt: new Date(now.getTime() + day) }, 3, now)).toBe(
      "upcoming",
    );
    expect(batchStatus({ ...batch, endsAt: now }, 3, now)).toBe("expired");
  });

  it("une licence dure son nombre de mois, sans dépasser la fin du contrat", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    expect(licenseEnd(start, 6, new Date("2027-01-01T00:00:00Z")).toISOString()).toBe(
      "2026-07-15T00:00:00.000Z",
    );
    expect(licenseEnd(start, 6, new Date("2026-03-01T00:00:00Z")).toISOString()).toBe(
      "2026-03-01T00:00:00.000Z",
    );
  });
});

describe("Import d'adresses", () => {
  it("lit un CSV avec colonnes email et prenom", () => {
    const list = parseInviteList(
      "﻿email;prenom\nA@jumanly.test;Amani\nmauvaise;X\na@jumanly.test;",
    );
    expect(list.valid).toEqual([{ email: "a@jumanly.test", firstName: "Amani" }]);
    expect(list.invalid).toEqual(["mauvaise"]);
    expect(list.duplicates).toBe(1);
  });

  it("lit une liste saisie à la main", () => {
    const list = parseInviteList("un@jumanly.test, deux@jumanly.test;trois@jumanly.test");
    expect(list.valid.map((item) => item.email)).toEqual([
      "un@jumanly.test",
      "deux@jumanly.test",
      "trois@jumanly.test",
    ]);
  });
});
