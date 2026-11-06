import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "./fixtures";

// Les tests de l'espace entreprise (étape 3) changent tous Baobab Fintech, l'entreprise fictive du
// seed : rôles de l'équipe, propriété de la page, formule, réglages. Deux workers qui la changent
// en même temps se gênent (la propriété passe à Aline pendant que l'équipe change un rôle) : ces
// fichiers la prennent donc à tour de rôle, le temps de leurs tests sur ordinateur.

// Évaluation recruteur (06/11/2026) : la même règle pour les autres données de démo partagées que
// des fichiers changent en même temps sur ordinateur et au téléphone (« horizon » : les offres
// d'entreprise@ ; « baobab » couvre aussi le groupe de démonstration, que l'équipe change).
export type DemoData = "baobab" | "horizon";

const lockOf = (name: DemoData) => join(tmpdir(), `jumanly-e2e-${name}.lock`);

function alive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Waits for Baobab Fintech to be free, then keeps it until the returned function is called. */
export function holdBaobab() {
  return holdDemo("baobab");
}

/** Waits for the demo data to be free, then keeps it until the returned function is called. */
export async function holdDemo(name: DemoData) {
  const LOCK = lockOf(name);
  for (;;) {
    try {
      mkdirSync(LOCK);
      writeFileSync(join(LOCK, "pid"), String(process.pid));
      return () => rmSync(LOCK, { recursive: true, force: true });
    } catch {
      // A worker that stopped without letting go (crash, Ctrl+C) leaves its pid behind.
      const owner = Number(
        (() => {
          try {
            return readFileSync(join(LOCK, "pid"), "utf8");
          } catch {
            return "0";
          }
        })(),
      );
      if (owner && !alive(owner)) rmSync(LOCK, { recursive: true, force: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

/**
 * Each test of the file takes the demo data in turn (beforeEach / afterEach). The wait does not
 * count in the test's own time: its timeout grows by what it waited.
 */
export function oneTestAtATimeOn(name: DemoData) {
  let release = () => {};
  test.beforeEach(async ({}, testInfo) => {
    const started = Date.now();
    testInfo.setTimeout(testInfo.timeout + 600_000);
    release = await holdDemo(name);
    testInfo.setTimeout(testInfo.timeout - 600_000 + (Date.now() - started));
  });
  test.afterEach(() => release());
}
