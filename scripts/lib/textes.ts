/**
 * Lecture des fichiers `textes/*.md` : chaque tableau dont l'en-tête est
 * `| Clé | Texte |` fournit des messages. Les clés sont pointées
 * (`commun.actions.enregistrer`) et deviennent des objets imbriqués pour next-intl.
 */

export type Messages = { [cle: string]: string | Messages };

export type EntreeTexte = {
  cle: string;
  texte: string;
  fichier: string;
  ligne: number;
};

const FORMAT_CLE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/;

function normaliser(valeur: string): string {
  return valeur.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** Découpe une ligne de tableau Markdown en cellules, en respectant `\|`. */
export function decouperLigne(ligne: string): string[] | null {
  const brute = ligne.trim();
  if (!brute.startsWith("|")) return null;
  const cellules: string[] = [];
  let courante = "";
  for (let i = 1; i < brute.length; i++) {
    const car = brute[i];
    if (car === "\\" && brute[i + 1] === "|") {
      courante += "|";
      i++;
    } else if (car === "|") {
      cellules.push(courante.trim());
      courante = "";
    } else {
      courante += car;
    }
  }
  if (courante.trim() !== "") cellules.push(courante.trim());
  return cellules;
}

function nettoyerCle(cellule: string): string {
  return cellule.replace(/^`+|`+$/g, "").trim();
}

function nettoyerTexte(cellule: string): string {
  return cellule.replace(/<br\s*\/?>/gi, "\n").trim();
}

/** Extrait les paires clé / texte d'un fichier Markdown. */
export function extraireEntrees(contenu: string, fichier: string): EntreeTexte[] {
  const entrees: EntreeTexte[] = [];
  const lignes = contenu.split(/\r?\n/);
  let dansTableau = false;

  lignes.forEach((ligne, index) => {
    const cellules = decouperLigne(ligne);
    if (!cellules) {
      dansTableau = false;
      return;
    }
    if (!dansTableau) {
      dansTableau =
        cellules.length >= 2 &&
        normaliser(cellules[0]) === "cle" &&
        normaliser(cellules[1]) === "texte";
      return;
    }
    if (cellules.every((c) => /^:?-{3,}:?$/.test(c))) return;
    const cle = nettoyerCle(cellules[0] ?? "");
    const texte = nettoyerTexte(cellules[1] ?? "");
    entrees.push({ cle, texte, fichier, ligne: index + 1 });
  });

  return entrees;
}

/** Construit l'objet de messages et liste toutes les erreurs trouvées. */
export function construireMessages(entrees: EntreeTexte[]): {
  messages: Messages;
  erreurs: string[];
} {
  const messages: Messages = {};
  const erreurs: string[] = [];
  const vues = new Map<string, EntreeTexte>();

  for (const entree of entrees) {
    const ou = `${entree.fichier}:${entree.ligne}`;
    if (!FORMAT_CLE.test(entree.cle)) {
      erreurs.push(`${ou} : clé invalide « ${entree.cle} »`);
      continue;
    }
    if (entree.texte === "") {
      erreurs.push(`${ou} : texte vide pour « ${entree.cle} »`);
      continue;
    }
    const precedente = vues.get(entree.cle);
    if (precedente) {
      erreurs.push(
        `${ou} : clé « ${entree.cle} » déjà définie dans ${precedente.fichier}:${precedente.ligne}`,
      );
      continue;
    }

    const parties = entree.cle.split(".");
    let noeud: Messages = messages;
    let conflit = false;
    for (const partie of parties.slice(0, -1)) {
      const suivant = noeud[partie];
      if (typeof suivant === "string") {
        conflit = true;
        break;
      }
      noeud = suivant ?? (noeud[partie] = {});
    }
    const derniere = parties[parties.length - 1];
    if (conflit || typeof noeud[derniere] === "object") {
      erreurs.push(`${ou} : « ${entree.cle} » entre en conflit avec une autre clé`);
      continue;
    }
    noeud[derniere] = entree.texte;
    vues.set(entree.cle, entree);
  }

  return { messages, erreurs };
}
