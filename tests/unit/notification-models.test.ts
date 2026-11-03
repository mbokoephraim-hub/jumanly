import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import { notificationModel } from "@/lib/notification-models";
import { notificationTypes } from "@/server/services/notifications";
import { whenLabel } from "@/server/services/interview-reminders";

describe("modèles de notifications", () => {
  it("donne un titre existant à chaque type", () => {
    const titles = fr.notifModels.title as Record<string, string>;
    const actions = fr.notifModels.action as Record<string, string>;
    for (const type of notificationTypes) {
      const model = notificationModel(type);
      expect(titles[model.title], type).toBeTruthy();
      if (model.action) expect(actions[model.action], type).toBeTruthy();
    }
  });

  it("classe les types demandés par Ephraïm", () => {
    expect(notificationModel("newMessage")).toMatchObject({ kind: "message", action: "reply" });
    expect(notificationModel("connectionRequest").kind).toBe("connexion");
    expect(notificationModel("newApplication").kind).toBe("candidature");
    expect(notificationModel("interviewSoon").kind).toBe("agenda");
    expect(notificationModel("inconnu").kind).toBe("autre");
  });

  it("dit aujourd'hui ou demain dans le fuseau de l'entretien", () => {
    const now = new Date("2026-11-03T20:00:00Z");
    expect(whenLabel(new Date("2026-11-04T09:00:00Z"), now, "Africa/Kinshasa")).toEqual({
      day: "tomorrow",
      time: "10:00",
    });
    expect(whenLabel(new Date("2026-11-03T21:30:00Z"), now, "UTC").day).toBe("today");
  });
});
