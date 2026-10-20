import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { hidesRecruiterTabBar } from "@/config/navigation";
import {
  checkJobSheet,
  JOB_SHEET_MAX_BYTES,
  jobStepOf,
  missingForPublication,
  offerColors,
  offerTabOf,
  sheetListItems,
  stepSchemas,
} from "@/server/services/hire-offers";
import { screeningAnswersFor } from "@/server/services/screening";
import { isProtectedCriterion } from "@/server/services/hire";

const now = new Date("2026-10-20T10:00:00Z");
const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000);

describe("Mes offres : onglets et couleurs", () => {
  it("range chaque offre dans son onglet", () => {
    expect(offerTabOf({ status: "published", closesAt: null }, now)).toBe("actives");
    expect(offerTabOf({ status: "published", closesAt: day(-1) }, now)).toBe("expirees");
    expect(offerTabOf({ status: "pending_review", closesAt: null }, now)).toBe("actives");
    expect(offerTabOf({ status: "changes_requested", closesAt: null }, now)).toBe("brouillons");
    expect(offerTabOf({ status: "paused", closesAt: null }, now)).toBe("pause");
    expect(offerTabOf({ status: "closed", closesAt: null }, now)).toBe("cloturees");
    expect(offerTabOf({ status: "archived", closesAt: null }, now)).toBeNull();
  });

  it("donne lime, menthe, ambre dans l'ordre de publication, bleu doux en validation", () => {
    const job = (
      id: string,
      status: "published" | "pending_review" | "draft" | "paused",
      at?: number,
    ) => ({
      id,
      status,
      publishedAt: at === undefined ? null : day(at),
      createdAt: day(-30),
    });
    const colors = offerColors([
      job("d", "published", -1),
      job("a", "published", -9),
      job("v", "pending_review"),
      job("b", "paused", -5),
      job("c", "published", -3),
      job("br", "draft"),
    ]);
    expect(Object.fromEntries(colors)).toEqual({
      a: "c1",
      b: "c2",
      c: "c3",
      d: "c1",
      v: "c4",
      br: "c0",
    });
  });
});

describe("formulaire de l'offre", () => {
  it("lit l'étape demandée, l'étape 1 sinon", () => {
    expect(jobStepOf("3")).toBe("candidature");
    expect(jobStepOf("verifier")).toBe("verifier");
    expect(jobStepOf("9")).toBe("poste");
    expect(jobStepOf(undefined)).toBe("poste");
  });

  it("vérifie la fourchette de salaire et le nombre de postes", () => {
    const base = {
      title: "Analyste",
      city: "Kinshasa",
      country: "RDC",
      remote: "onsite",
      contractType: "cdi",
    };
    expect(
      stepSchemas.poste.safeParse({ ...base, salaryMin: "900", salaryMax: "500" }).success,
    ).toBe(false);
    const parsed = stepSchemas.poste.parse({ ...base, salaryMin: "500", openings: "3" });
    expect(parsed).toMatchObject({ salaryMin: 50_000, salaryMax: null, openings: 3 });
    expect(stepSchemas.poste.safeParse({ ...base, openings: "0" }).success).toBe(false);
  });

  it("refuse une question de présélection sur une donnée protégée", () => {
    const questions = (text: string) => JSON.stringify([{ id: "q1", text, kind: "yesno" }]);
    expect(
      stepSchemas.candidature.safeParse({ questions: questions("Avez-vous des enfants ?") })
        .success,
    ).toBe(false);
    expect(
      stepSchemas.candidature.safeParse({ questions: questions("Quel est votre âge ?") }).success,
    ).toBe(false);
    expect(
      stepSchemas.candidature.safeParse({ questions: questions("Avez-vous déjà utilisé SQL ?") })
        .success,
    ).toBe(true);
  });

  it("reconnaît « âge » comme une donnée protégée, pas « usage » ni « stage »", () => {
    expect(isProtectedCriterion("Âge maximum 30 ans")).toBe(true);
    expect(isProtectedCriterion("Bon usage d'Excel")).toBe(false);
    expect(isProtectedCriterion("Stage de fin d'études")).toBe(false);
  });

  it("dit ce qui manque avant de publier", () => {
    expect(missingForPublication({ description: " ", skills: [] })).toEqual([
      "description",
      "skills",
    ]);
    expect(
      missingForPublication({ description: "Poste", skills: [{ importance: "required" }] }),
    ).toEqual([]);
  });
});

describe("questions de présélection (règle d'or n° 1)", () => {
  const questions = [
    { id: "q1", text: "Disponible avant décembre ?", kind: "yesno" as const },
    { id: "q2", text: "Votre outil préféré ?", kind: "text" as const },
  ];
  it("garde seulement les réponses valables aux questions de l'offre", () => {
    expect(screeningAnswersFor(questions, {})).toEqual([]);
    expect(screeningAnswersFor(questions, { q1: "yes", q2: "", autre: "x" })).toEqual([
      { id: "q1", question: "Disponible avant décembre ?", kind: "yesno", answer: "yes" },
    ]);
    expect(screeningAnswersFor(questions, { q1: "peut-être" })).toEqual([]);
  });
});

describe("fiche de poste en PDF", () => {
  async function pdf(setup?: (doc: PDFDocument) => void) {
    const doc = await PDFDocument.create();
    doc.addPage().drawText("- Construire les tableaux de bord");
    setup?.(doc);
    return doc.save();
  }

  it("accepte un PDF simple et en lit le texte", async () => {
    const result = await checkJobSheet(await pdf());
    expect(result.pages).toBe(1);
    expect(result.text[0]).toContain("Construire les tableaux de bord");
  });

  it("refuse ce qui n'est pas un PDF", async () => {
    await expect(checkJobSheet(new TextEncoder().encode("<html>"))).rejects.toMatchObject({
      code: "type",
    });
  });

  it("refuse un PDF trop lourd", async () => {
    const big = new Uint8Array(JOB_SHEET_MAX_BYTES + 1);
    big.set([0x25, 0x50, 0x44, 0x46]);
    await expect(checkJobSheet(big)).rejects.toMatchObject({ code: "size" });
  });

  it("refuse un PDF avec du JavaScript", async () => {
    const bytes = await pdf((doc) => {
      const action = doc.context.obj({
        Type: "Action",
        S: "JavaScript",
        JS: PDFString.of("app.alert(1)"),
      });
      doc.catalog.set(PDFName.of("OpenAction"), doc.context.register(action));
    });
    await expect(checkJobSheet(bytes)).rejects.toMatchObject({ code: "active" });
  });

  it("refuse un PDF qui lance une application", async () => {
    const bytes = await pdf((doc) => {
      const action = doc.context.obj({ S: "Launch", F: PDFString.of("calc.exe") });
      doc.catalog.set(PDFName.of("OpenAction"), doc.context.register(action));
    });
    await expect(checkJobSheet(bytes)).rejects.toMatchObject({ code: "active" });
  });

  it("propose les éléments de liste absents de l'offre, sans rien inventer", () => {
    const pages = [
      "Le poste\n• Construire les tableaux de bord\n- Préparer le rapport mensuel\n1. Former les agences au suivi\nTexte libre",
    ];
    expect(sheetListItems(pages, ["Construire les tableaux de bord"])).toEqual([
      "Préparer le rapport mensuel",
      "Former les agences au suivi",
    ]);
  });
});

describe("barre du bas de l'espace recruteur", () => {
  it("se cache sur une offre, ses étapes et sa fiche, pas sur Mes offres", () => {
    expect(hidesRecruiterTabBar("/app/hire/offres")).toBe(false);
    expect(hidesRecruiterTabBar("/app/hire")).toBe(false);
    expect(hidesRecruiterTabBar("/app/hire/offres/nouvelle")).toBe(true);
    expect(hidesRecruiterTabBar("/app/hire/offres/abc")).toBe(true);
    expect(hidesRecruiterTabBar("/app/hire/offres/abc/modifier")).toBe(true);
    expect(hidesRecruiterTabBar("/app/hire/offres/abc/fiche")).toBe(true);
  });
});
