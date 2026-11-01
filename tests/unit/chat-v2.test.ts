import { describe, expect, it } from "vitest";
import { REACTIONS } from "@/lib/reactions";
import { ringColors, suggestReplies } from "@/server/services/chat";
import { isWordDocument } from "@/server/services/message-media";
import { interviewCalendar } from "@/server/services/suivi";

describe("réponses suggérées par Orbi (Chat v2, règles sans modèle)", () => {
  it("propose d'envoyer tout de suite un document demandé, puis l'entretien", () => {
    expect(
      suggestReplies({
        peer: false,
        last: { kind: "text", body: "Pouvez-vous m’envoyer votre attestation Excel avant jeudi ?" },
        interview: { confirmed: true, onSite: true, video: false },
      }),
    ).toEqual(["sendNow", "there", "address"]);
  });

  it("propose de choisir un créneau tant que l'entretien n'est pas confirmé", () => {
    expect(
      suggestReplies({
        peer: false,
        last: { kind: "invitation", body: "Entretien" },
        interview: { confirmed: false, onSite: false, video: true },
      }),
    ).toEqual(["choose", "thanks", "received"]);
  });

  it("répond simplement à une connexion, et à une question par oui", () => {
    expect(
      suggestReplies({
        peer: true,
        last: { kind: "text", body: "On se voit demain ?" },
        interview: null,
      }),
    ).toEqual(["peerYes", "peerThanks", "peerLater"]);
  });

  it("ne propose rien sans message reçu, et jamais plus de trois réponses", () => {
    expect(suggestReplies({ peer: false, last: null, interview: null })).toEqual([]);
    const many = suggestReplies({
      peer: false,
      last: { kind: "document_request", body: "Envoyez votre CV ?" },
      interview: { confirmed: true, onSite: false, video: true },
    });
    expect(many.length).toBeLessThanOrEqual(3);
  });
});

describe("anneau des avatars", () => {
  it("prend les couleurs des compétences, sans doublon", () => {
    const colors = ringColors("Nadia Kalala", ["Excel", "SQL", "Power BI", "Python"]);
    expect(colors.length).toBeGreaterThanOrEqual(2);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("tire trois couleurs du nom, toujours les mêmes, sans compétences", () => {
    expect(ringColors("Baobab Fintech")).toHaveLength(3);
    expect(ringColors("Baobab Fintech")).toEqual(ringColors("Baobab Fintech"));
  });
});

describe("pièces jointes et agenda", () => {
  it("reconnaît un document Word à ses octets, pas à son nom", () => {
    const zip = (inside: string) =>
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...Buffer.from(`....${inside}....`)]);
    expect(isWordDocument(zip("word/document.xml"))).toBe(true);
    expect(isWordDocument(zip("xl/workbook.xml"))).toBe(false);
    expect(isWordDocument(new Uint8Array(Buffer.from("word/document.xml")))).toBe(false);
  });

  it("ajoute deux rappels à l'entretien : la veille et une heure avant", () => {
    const ics = interviewCalendar({
      id: "abc",
      startsAt: new Date("2030-10-23T09:00:00Z"),
      durationMinutes: 45,
      summary: "Entretien",
      description: "",
      location: "",
    });
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(ics).toContain("TRIGGER:-PT1H");
    expect(ics).toContain("TRIGGER:-P1D");
  });

  it("six réactions, comme la maquette", () => {
    expect(REACTIONS).toEqual(["❤️", "👍", "🙏", "😊", "🎉", "👏"]);
  });
});

describe("heure d'un entretien", () => {
  it("lit l'heure et les minutes en nombres, dans le fuseau", async () => {
    const { clockParts } = await import("@/lib/clock-parts");
    expect(clockParts(new Date("2030-10-23T09:30:00Z"), "Africa/Kinshasa")).toEqual({
      hour: 10,
      minute: 30,
    });
  });
});
