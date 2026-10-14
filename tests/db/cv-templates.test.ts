import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { invalidate } from "@/server/entitlements";
import { applyTemplate, canUseTemplate, emptyCv, updateCvStyle } from "@/server/services/cv";
import { cvTemplateRegistry, templateOf } from "@/features/cv/templates/registry";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

afterAll(async () => {
  await cleanup(users);
  await db.$disconnect();
});
beforeEach(() => invalidate());

/** A talent with a CV, on the cheapest talent plan whose template access is `access` (or Free). */
async function talentWithCv(access?: "starter" | "pro") {
  const user = await newUser();
  users.push(user.id);
  if (access) {
    const plan = await db.plan.findFirstOrThrow({
      where: {
        family: "talent",
        entitlements: { some: { key: "career.cv.templates.access", value: access } },
      },
      orderBy: { priceCents: "asc" },
    });
    const now = new Date();
    await db.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: plan.id,
        status: "active",
        source: "self",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      },
    });
  }
  const profile = await db.talentProfile.create({ data: { userId: user.id } });
  const content = {
    ...emptyCv,
    info: { ...emptyCv.info, name: "Test Fictif", city: "Bukavu" },
    summary: "Résumé de test qui ne doit jamais changer.",
  };
  const cv = await db.document.create({
    data: { profileId: profile.id, kind: "cv", title: "CV test", content },
  });
  return { user, cv };
}

describe("droit career.cv.templates.access (docs/modeles-cv § 2 point 6)", () => {
  it("un compte Free applique un modèle gratuit mais jamais un modèle Starter ou Pro", async () => {
    const { user, cv } = await talentWithCv();
    expect(await applyTemplate(db, user.id, cv.id, "moderne")).toBe("applied");
    for (const template of cvTemplateRegistry.filter((item) => item.access !== "free")) {
      expect(await applyTemplate(db, user.id, cv.id, template.id)).toBe("locked");
      expect(await canUseTemplate(db, { type: "user", id: user.id }, template)).toBe(false);
    }
    const stored = await db.document.findUniqueOrThrow({ where: { id: cv.id } });
    expect(stored.templateId).toBe("moderne");
  });

  it("Starter ouvre les modèles Starter, pas les modèles Pro", async () => {
    const { user, cv } = await talentWithCv("starter");
    const starter = cvTemplateRegistry.find((item) => item.access === "starter")!;
    const pro = cvTemplateRegistry.find((item) => item.access === "pro")!;
    expect(await applyTemplate(db, user.id, cv.id, starter.id)).toBe("applied");
    expect(await applyTemplate(db, user.id, cv.id, pro.id)).toBe("locked");
  });

  it("appliquer les 15 modèles à la suite ne modifie jamais le contenu", async () => {
    const { user, cv } = await talentWithCv("pro");
    for (const template of cvTemplateRegistry) {
      expect(await applyTemplate(db, user.id, cv.id, template.id)).toBe("applied");
    }
    const stored = await db.document.findUniqueOrThrow({ where: { id: cv.id } });
    expect(stored.content).toEqual(cv.content);
    expect(stored.templateId).toBe(cvTemplateRegistry.at(-1)!.id);
  });

  it("un modèle inconnu ou le CV d'un autre compte est refusé", async () => {
    const { user, cv } = await talentWithCv();
    const other = await talentWithCv();
    expect(await applyTemplate(db, user.id, cv.id, "inexistant")).toBe("unknown");
    expect(await applyTemplate(db, other.user.id, cv.id, "moderne")).toBe("notFound");
  });
});

describe("réglages (§ 4.1)", () => {
  it("une couleur de contraste insuffisant est refusée, une couleur lisible est enregistrée", async () => {
    const { user, cv } = await talentWithCv();
    expect(
      await updateCvStyle(db, user.id, cv.id, (style) => ({ ...style, accent: "#FFE066" })),
    ).toBe("tooLight");
    expect(
      await updateCvStyle(db, user.id, cv.id, (style) => ({ ...style, accent: "#1F4E79" })),
    ).toBe("saved");
    const stored = await db.document.findUniqueOrThrow({ where: { id: cv.id } });
    expect((stored.style as { accent: string }).accent).toBe("#1F4E79");
    expect(stored.content).toEqual(cv.content);
    expect(templateOf(stored.templateId).id).toBe("classique");
  });
});
