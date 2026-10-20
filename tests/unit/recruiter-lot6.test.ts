import { describe, expect, it } from "vitest";
import { groupRows } from "@/server/services/hire-ats";
import { personalize } from "@/server/services/hire-group-replies";
import { isOnline, receiptOf } from "@/server/services/hire-messaging";
import { daysLeft, dueReminder } from "@/server/services/job-reminders";
import { normalizeOrgName, professionalDomain } from "@/server/services/org-join";

describe("réponses groupées : personnalisation", () => {
  it("remplace les quatre champs et laisse le reste du texte tel quel", () => {
    const text = personalize(
      "Bonjour {prenom}, {point_fort} Poste {poste} chez {entreprise}. {nom}",
      {
        firstName: "Amani",
        strength: "Votre projet SQL a retenu notre attention.",
        jobTitle: "Analyste",
        company: "Baobab",
      },
    );
    expect(text).toBe(
      "Bonjour Amani, Votre projet SQL a retenu notre attention. Poste Analyste chez Baobab. {nom}",
    );
  });
});

describe("ATS : la règle des recommandés", () => {
  const row = (id: string, data: Partial<Parameters<typeof groupRows>[0][number]> = {}) => ({
    id,
    status: "active",
    score: 80,
    analysis: { strengths: [], toVerify: [], source: "template" as const },
    missingRequired: 0,
    toCheck: [] as string[],
    createdAt: new Date("2026-10-01T00:00:00Z"),
    ...data,
  });

  it("au plus cinq, toutes les compétences requises, au-dessus du seuil, jamais un non analysé", () => {
    const rows = [
      ...Array.from({ length: 7 }, (_, i) => row(`r${i}`, { score: 90 - i })),
      row("low", { score: 60 }),
      row("missing", { score: 95, missingRequired: 1, toCheck: ["SQL"] }),
      row("unread", { score: 99, analysis: null }),
      row("rejected", { score: 99, status: "rejected" }),
    ];
    const group = groupRows(rows, true);
    expect(rows.filter((item) => group(item) === "recommended").map((item) => item.id)).toEqual([
      "r0",
      "r1",
      "r2",
      "r3",
      "r4",
    ]);
    expect(group(rows.find((item) => item.id === "missing")!)).toBe("verify");
    expect(group(rows.find((item) => item.id === "unread")!)).toBe("other");
    expect(group(rows.find((item) => item.id === "rejected")!)).toBe("other");
  });

  it("sans scores affichés, le seuil ne compte pas", () => {
    const group = groupRows([row("a", { score: null })], false);
    expect(group(row("a", { score: null }))).toBe("recommended");
  });
});

describe("rappels de fin d'offre", () => {
  const now = new Date("2026-10-20T08:00:00Z");
  it("compte les jours du calendrier dans le fuseau de la plateforme", () => {
    expect(daysLeft(new Date("2026-10-23T23:00:00Z"), now, "UTC")).toBe(3);
    expect(daysLeft(new Date("2026-10-20T22:00:00Z"), now, "UTC")).toBe(0);
    // At Kinshasa (UTC+1) 23:30 UTC is already the next day.
    expect(daysLeft(new Date("2026-10-22T23:30:00Z"), now, "Africa/Kinshasa")).toBe(3);
  });

  it("un rappel par jour prévu, jamais deux fois", () => {
    const closes = new Date("2026-10-23T12:00:00Z");
    expect(dueReminder(closes, now, [], "UTC")).toBe("d3");
    expect(dueReminder(closes, now, ["d3"], "UTC")).toBeNull();
    expect(dueReminder(new Date("2026-10-25T12:00:00Z"), now, [], "UTC")).toBeNull();
    expect(dueReminder(new Date("2026-10-20T18:00:00Z"), now, [], "UTC")).toBe("d0");
  });
});

describe("rejoindre une organisation", () => {
  it("un nom écrit autrement reste le même nom", () => {
    expect(normalizeOrgName("Baobab Fintech SARL")).toBe(normalizeOrgName("baobab-fintech"));
    expect(normalizeOrgName("Société Énergie")).toBe("societeenergie");
  });

  it("une boîte gratuite ne dit rien de l'employeur", () => {
    expect(professionalDomain("awa@gmail.com")).toBeNull();
    expect(professionalDomain("test@jumanly.test")).toBeNull();
    expect(professionalDomain("Awa@Baobab-Fictive.CD")).toBe("baobab-fictive.cd");
  });
});

describe("messagerie : en ligne et accusés de lecture", () => {
  const now = new Date("2026-10-20T10:00:00Z");
  const seen = new Date("2026-10-20T09:58:00Z");

  it("en ligne seulement si chacun garde sa présence visible", () => {
    expect(isOnline({ lastSeenAt: seen, showPresence: true }, { showPresence: true }, now)).toBe(
      true,
    );
    expect(isOnline({ lastSeenAt: seen, showPresence: false }, { showPresence: true }, now)).toBe(
      false,
    );
    expect(isOnline({ lastSeenAt: seen, showPresence: true }, { showPresence: false }, now)).toBe(
      false,
    );
    const old = new Date("2026-10-20T09:50:00Z");
    expect(isOnline({ lastSeenAt: old, showPresence: true }, { showPresence: true }, now)).toBe(
      false,
    );
  });

  it("« Lu » seulement si les deux gardent les accusés de lecture", () => {
    const message = { createdAt: new Date("2026-10-20T09:00:00Z") };
    const read = { readReceipts: true, lastReadAt: seen };
    expect(receiptOf(message, read, { readReceipts: true })).toBe("read");
    expect(receiptOf(message, read, { readReceipts: false })).toBe("delivered");
    expect(receiptOf(message, { ...read, readReceipts: false }, { readReceipts: true })).toBe(
      "delivered",
    );
    expect(receiptOf(message, { ...read, lastReadAt: null }, { readReceipts: true })).toBe(
      "delivered",
    );
    expect(receiptOf(null, read, { readReceipts: true })).toBeNull();
  });
});
