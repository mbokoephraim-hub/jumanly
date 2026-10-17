import { describe, expect, it } from "vitest";
import { decisionParagraphs, fillTemplate } from "@/server/services/message-templates";
import { interviewCalendar } from "@/server/services/suivi";

describe("modèles de message (prompt 5)", () => {
  const values = {
    firstName: "Awa",
    jobTitle: "Comptable junior",
    company: "Entreprise fictive",
    signer: "Moussa Fictif",
  };

  it("remplace les quatre repères et laisse le reste tel quel", () => {
    expect(
      fillTemplate(
        "Bonjour {prenom}, le poste {poste} chez {entreprise}. {signataire} {autre}",
        values,
      ),
    ).toBe("Bonjour Awa, le poste Comptable junior chez Entreprise fictive. Moussa Fictif {autre}");
  });

  it("découpe une décision en paragraphes, sans paragraphe vide", () => {
    expect(decisionParagraphs("Bonjour Awa,\n\nMerci.\n  \n\nÀ bientôt.\n")).toEqual([
      "Bonjour Awa,",
      "Merci.",
      "À bientôt.",
    ]);
  });
});

describe("fichier d'agenda d'un entretien", () => {
  it("écrit l'heure en UTC, la durée et échappe le texte", () => {
    const ics = interviewCalendar({
      id: "abc",
      startsAt: new Date("2030-10-23T09:00:00Z"),
      durationMinutes: 45,
      summary: "Entretien · Analyste, junior; Kinshasa",
      description: "Ligne 1\nLigne 2",
      location: "https://visio.exemple.test/abc",
      now: new Date("2030-10-20T08:00:00Z"),
    });
    expect(ics).toContain("DTSTART:20301023T090000Z");
    expect(ics).toContain("DTEND:20301023T094500Z");
    expect(ics).toContain(String.raw`SUMMARY:Entretien · Analyste\, junior\; Kinshasa`);
    expect(ics).toContain("DESCRIPTION:Ligne 1\\nLigne 2");
    expect(ics).toContain("UID:abc@jumanly.io");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
