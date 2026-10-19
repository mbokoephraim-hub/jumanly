import { describe, expect, it } from "vitest";
import {
  categoryOf,
  NOTIFICATION_CATEGORIES,
  notificationCategories,
  notificationTypes,
} from "@/server/services/notifications";

describe("réglages des notifications (lot 7)", () => {
  it("range chaque type dans une seule catégorie", () => {
    const seen = new Set<string>();
    for (const category of NOTIFICATION_CATEGORIES)
      for (const type of notificationCategories[category]) {
        expect(seen.has(type), type).toBe(false);
        seen.add(type);
        expect(notificationTypes).toContain(type);
      }
  });

  it("trouve la catégorie d'un type, et aucune pour ceux qu'on ne peut pas couper", () => {
    expect(categoryOf("statusChange")).toBe("applications");
    expect(categoryOf("newMessage")).toBe("messages");
    expect(categoryOf("certificateIssued")).toBe("learning");
    expect(categoryOf("renewalDue")).toBe("billing");
    expect(categoryOf("newApplication")).toBeNull();
  });
});
