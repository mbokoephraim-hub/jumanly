import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Les tests de l'espace entreprise (étape 3) changent tous Baobab Fintech, l'entreprise fictive du
// seed : rôles de l'équipe, propriété de la page, formule, réglages. Deux workers qui la changent
// en même temps se gênent (la propriété passe à Aline pendant que l'équipe change un rôle) : ces
// fichiers la prennent donc à tour de rôle, le temps de leurs tests sur ordinateur.

const LOCK = join(tmpdir(), "jumanly-e2e-baobab.lock");

function alive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Waits for Baobab Fintech to be free, then keeps it until the returned function is called. */
export async function holdBaobab() {
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
