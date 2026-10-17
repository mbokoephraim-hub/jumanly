import { describe, expect, it } from "vitest";
import { outlineFromForm } from "@/server/services/course-admin";
import { brandImageAt, brandSrcSet } from "@/server/services/organization-brand";
import { lessonOutline, transcriptCues } from "@/server/services/learn";

describe("leçon v7 (prompt 4 bis, écrans 14 et 68)", () => {
  it("lit le plan de la leçon ; chaque partie est facultative", () => {
    expect(lessonOutline(null)).toEqual({ brief: null, steps: [], takeaways: [] });
    expect(lessonOutline({ paragraphs: ["Texte"] })).toEqual({
      brief: null,
      steps: [],
      takeaways: [],
    });
    expect(
      lessonOutline({
        paragraphs: [],
        brief: " Un tableau croisé regroupe vos lignes. ",
        steps: [{ title: "Préparer une plage propre", minutes: 2 }],
        takeaways: ["Des titres sur chaque colonne"],
      }),
    ).toEqual({
      brief: "Un tableau croisé regroupe vos lignes.",
      steps: [{ title: "Préparer une plage propre", minutes: 2 }],
      takeaways: ["Des titres sur chaque colonne"],
    });
  });

  it("le formulaire d'administration écrit le plan ligne par ligne, avec des limites", () => {
    expect(
      outlineFromForm({
        brief: "  En deux phrases.  ",
        steps: "Préparer une plage propre | 2\nChoisir lignes, colonnes, valeurs|4\nSans durée",
        takeaways: "Un\nDeux\nTrois\nQuatre",
      }),
    ).toEqual({
      brief: "En deux phrases.",
      steps: [
        { title: "Préparer une plage propre", minutes: 2 },
        { title: "Choisir lignes, colonnes, valeurs", minutes: 4 },
        { title: "Sans durée", minutes: 0 },
      ],
      takeaways: ["Un", "Deux", "Trois"],
    });
    expect(outlineFromForm({ brief: "", steps: "", takeaways: "" })).toEqual({});
    const many = Array.from({ length: 9 }, (_, index) => `Étape ${index} | 1`).join("\n");
    expect(outlineFromForm({ brief: "", steps: many, takeaways: "" }).steps).toHaveLength(6);
  });

  it("une ligne de transcription qui commence par un moment suit la vidéo", () => {
    expect(
      transcriptCues(
        "05:40 Avant tout, vérifiez les titres.\n\n[06:12] Choisissez Insertion.\n1:02:03 Fin.",
      ),
    ).toEqual([
      { at: 340, text: "Avant tout, vérifiez les titres." },
      { at: 372, text: "Choisissez Insertion." },
      { at: 3723, text: "Fin." },
    ]);
    expect(transcriptCues("Une phrase sans moment.")).toEqual([
      { at: null, text: "Une phrase sans moment." },
    ]);
    expect(transcriptCues(null)).toEqual([]);
  });
});

describe("images de l'entreprise (prompt 4 bis)", () => {
  it("donne les autres largeurs d'une bannière ou d'un logo", () => {
    const banner = "/medias/orgs/o1/banner-abc-1000.webp";
    expect(brandImageAt(banner, 640)).toBe("/medias/orgs/o1/banner-abc-640.webp");
    expect(brandSrcSet(banner, "banner")).toBe(
      "/medias/orgs/o1/banner-abc-640.webp 640w, /medias/orgs/o1/banner-abc-1000.webp 1000w, /medias/orgs/o1/banner-abc-1500.webp 1500w",
    );
    expect(brandSrcSet("/medias/orgs/o1/logo-x-256.webp", "logo")).toBe(
      "/medias/orgs/o1/logo-x-128.webp 128w, /medias/orgs/o1/logo-x-256.webp 256w",
    );
  });
});
