import { describe, expect, it } from "vitest";
import { senderWithName } from "@/server/adapters/email";
import { companyNoticeBody } from "@/server/services/company-notice";

describe("lettres de l'entreprise au candidat", () => {
  it("accusé de réception : salutation, lettre et signature au nom de l'entreprise", () => {
    const body = companyNoticeBody("received", {
      firstName: "Aïcha",
      jobTitle: "Analyste de données",
      company: "Cabinet Exemple",
    });
    const [greeting, letter, signature] = body.split("\n\n");
    expect(greeting).toBe("Bonjour Aïcha,");
    expect(letter).toContain("bien reçu votre candidature au poste Analyste de données");
    expect(letter).toContain("reviendrons vers vous");
    expect(signature).toBe("L'équipe Cabinet Exemple");
  });

  it("candidature retenue, sans prénom", () => {
    const body = companyNoticeBody("retained", {
      firstName: " ",
      jobTitle: "Comptable",
      company: "Cabinet Exemple",
    });
    expect(body.startsWith("Bonjour,\n\n")).toBe(true);
    expect(body).toContain("est retenue");
  });

  it("l'e-mail part au nom de l'entreprise, depuis l'adresse de Jumanly", () => {
    expect(senderWithName("Jumanly <infojumanly@gmail.com>", "Cabinet Exemple via Jumanly")).toBe(
      '"Cabinet Exemple via Jumanly" <infojumanly@gmail.com>',
    );
    expect(senderWithName("a@b.io", 'X "Y" <z>')).toBe('"X Y z" <a@b.io>');
    expect(senderWithName("Jumanly <a@b.io>")).toBe("Jumanly <a@b.io>");
  });
});
