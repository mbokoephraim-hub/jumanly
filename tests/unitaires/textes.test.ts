import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construireMessages, decouperLigne, extraireEntrees } from "../../scripts/lib/textes";

describe("decouperLigne", () => {
  it("découpe les cellules et garde les barres échappées", () => {
    expect(decouperLigne("| `a.b` | Oui \\| Non |")).toEqual(["`a.b`", "Oui | Non"]);
  });

  it("ignore les lignes qui ne sont pas des tableaux", () => {
    expect(decouperLigne("Un paragraphe")).toBeNull();
  });
});

describe("extraireEntrees", () => {
  it("ne lit que les tableaux « Clé | Texte »", () => {
    const contenu = [
      "# Titre",
      "| Colonne | Autre |",
      "|---|---|",
      "| ignoree | oui |",
      "",
      "| Clé | Texte |",
      "|:---|---|",
      "| `accueil.titre` | Bienvenue |",
      "| accueil.sousTitre | Ligne 1<br>Ligne 2 |",
    ].join("\n");
    expect(extraireEntrees(contenu, "test.md")).toEqual([
      { cle: "accueil.titre", texte: "Bienvenue", fichier: "test.md", ligne: 8 },
      { cle: "accueil.sousTitre", texte: "Ligne 1\nLigne 2", fichier: "test.md", ligne: 9 },
    ]);
  });

  it("accepte l'en-tête sans accent", () => {
    const contenu = "| Cle | Texte |\n|---|---|\n| a | b |";
    expect(extraireEntrees(contenu, "x.md")).toHaveLength(1);
  });
});

describe("construireMessages", () => {
  const entree = (cle: string, texte = "x", ligne = 1) => ({ cle, texte, fichier: "f.md", ligne });

  it("construit des objets imbriqués", () => {
    const { messages, erreurs } = construireMessages([entree("a.b.c", "1"), entree("a.d", "2")]);
    expect(erreurs).toEqual([]);
    expect(messages).toEqual({ a: { b: { c: "1" }, d: "2" } });
  });

  it("signale les doublons, les clés invalides, les textes vides et les conflits", () => {
    const { erreurs } = construireMessages([
      entree("a.b", "1", 1),
      entree("a.b", "2", 2),
      entree("a b", "3", 3),
      entree("a.c", "", 4),
      entree("a.b.c", "5", 5),
      entree("a", "6", 6),
    ]);
    expect(erreurs).toHaveLength(5);
    expect(erreurs[0]).toContain("déjà définie");
    expect(erreurs[1]).toContain("clé invalide");
    expect(erreurs[2]).toContain("texte vide");
    expect(erreurs[3]).toContain("conflit");
    expect(erreurs[4]).toContain("conflit");
  });
});

describe("textes/ du dépôt", () => {
  it("ne contient aucune erreur et correspond à messages/fr.json", () => {
    const racine = join(import.meta.dirname, "..", "..");
    const dossier = join(racine, "textes");
    const entrees = readdirSync(dossier)
      .filter((nom) => nom.endsWith(".md") && nom.toLowerCase() !== "lisezmoi.md")
      .sort()
      .flatMap((nom) => extraireEntrees(readFileSync(join(dossier, nom), "utf8"), nom));
    const { messages, erreurs } = construireMessages(entrees);
    expect(erreurs).toEqual([]);
    const fr = JSON.parse(readFileSync(join(racine, "messages", "fr.json"), "utf8"));
    expect(fr).toEqual(messages);
  });

  it("ne contient aucun numéro de téléphone", () => {
    const fr = readFileSync(join(import.meta.dirname, "..", "..", "messages", "fr.json"), "utf8");
    expect(fr).not.toMatch(/\+?\d[\d .-]{7,}\d/);
  });
});
