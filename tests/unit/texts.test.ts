import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildMessages, extractEntries, isTextFile, splitRow } from "../../scripts/lib/texts";

const root = join(import.meta.dirname, "..", "..");

describe("splitRow", () => {
  it("découpe les cellules et garde les barres échappées", () => {
    expect(splitRow("| `a.b` | Oui \\| Non |")).toEqual(["`a.b`", "Oui | Non"]);
  });

  it("ignore les lignes qui ne sont pas des tableaux", () => {
    expect(splitRow("Un paragraphe")).toBeNull();
  });
});

describe("extractEntries", () => {
  it("ne lit que les tableaux « Clé | Texte »", () => {
    const content = [
      "# Titre",
      "| Colonne | Autre |",
      "|---|---|",
      "| ignored | oui |",
      "",
      "| Clé | Texte |",
      "|:---|---|",
      "| `home.title` | Bienvenue |",
      "| home.subtitle | Ligne 1<br>Ligne 2 |",
    ].join("\n");
    expect(extractEntries(content, "test.md")).toEqual([
      { key: "home.title", text: "Bienvenue", file: "test.md", line: 8 },
      { key: "home.subtitle", text: "Ligne 1\nLigne 2", file: "test.md", line: 9 },
    ]);
  });

  it("accepte l'en-tête sans accent", () => {
    expect(extractEntries("| Cle | Texte |\n|---|---|\n| a | b |", "x.md")).toHaveLength(1);
  });
});

describe("buildMessages", () => {
  const entry = (key: string, text = "x", line = 1) => ({ key, text, file: "f.md", line });

  it("construit des objets imbriqués", () => {
    const { messages, errors } = buildMessages([entry("a.b.c", "1"), entry("a.d", "2")]);
    expect(errors).toEqual([]);
    expect(messages).toEqual({ a: { b: { c: "1" }, d: "2" } });
  });

  it("signale doublons, clés invalides, textes vides et conflits", () => {
    const { errors } = buildMessages([
      entry("a.b", "1", 1),
      entry("a.b", "2", 2),
      entry("a b", "3", 3),
      entry("a.c", "", 4),
      entry("a.b.c", "5", 5),
      entry("a", "6", 6),
    ]);
    expect(errors).toHaveLength(5);
    expect(errors[0]).toContain("déjà définie");
    expect(errors[1]).toContain("clé invalide");
    expect(errors[2]).toContain("texte vide");
    expect(errors[3]).toContain("conflit");
    expect(errors[4]).toContain("conflit");
  });
});

describe("textes/ du dépôt", () => {
  const dir = join(root, "textes");
  const entries = readdirSync(dir)
    .filter(isTextFile)
    .sort()
    .flatMap((name) => extractEntries(readFileSync(join(dir, name), "utf8"), name));
  const { messages, errors } = buildMessages(entries);
  const generated = readFileSync(join(root, "messages", "fr.json"), "utf8");

  it("ne contient aucune erreur et correspond à messages/fr.json", () => {
    expect(errors).toEqual([]);
    expect(JSON.parse(generated)).toEqual(messages);
  });

  it("ne contient aucun numéro de téléphone (CLAUDE.md § 8)", () => {
    expect(generated).not.toMatch(/\+?\d[\d .-]{7,}\d/);
  });
});
