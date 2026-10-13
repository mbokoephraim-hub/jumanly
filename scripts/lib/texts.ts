/**
 * Reads `textes/*.md`: every table whose header is `| Clé | Texte |` provides messages.
 * Keys are dotted (`common.brand.name`) and become nested objects for next-intl.
 */

export type Messages = { [key: string]: string | Messages };

export type TextEntry = {
  key: string;
  text: string;
  file: string;
  line: number;
};

const KEY_FORMAT = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** Splits a Markdown table row into cells, keeping escaped `\|`. */
export function splitRow(row: string): string[] | null {
  const raw = row.trim();
  if (!raw.startsWith("|")) return null;
  const cells: string[] = [];
  let current = "";
  for (let i = 1; i < raw.length; i++) {
    const char = raw[i];
    if (char === "\\" && raw[i + 1] === "|") {
      current += "|";
      i++;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim() !== "") cells.push(current.trim());
  return cells;
}

function cleanKey(cell: string): string {
  return cell.replace(/^`+|`+$/g, "").trim();
}

function cleanText(cell: string): string {
  return cell.replace(/<br\s*\/?>/gi, "\n").trim();
}

/** Extracts key / text pairs from a Markdown file. */
export function extractEntries(content: string, file: string): TextEntry[] {
  const entries: TextEntry[] = [];
  let inTable = false;

  content.split(/\r?\n/).forEach((row, index) => {
    const cells = splitRow(row);
    if (!cells) {
      inTable = false;
      return;
    }
    if (!inTable) {
      inTable =
        cells.length >= 2 && normalize(cells[0]) === "cle" && normalize(cells[1]) === "texte";
      return;
    }
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return;
    entries.push({
      key: cleanKey(cells[0] ?? ""),
      text: cleanText(cells[1] ?? ""),
      file,
      line: index + 1,
    });
  });

  return entries;
}

/** Builds the messages object and lists every problem found (in French, for the team). */
export function buildMessages(entries: TextEntry[]): { messages: Messages; errors: string[] } {
  const messages: Messages = {};
  const errors: string[] = [];
  const seen = new Map<string, TextEntry>();

  for (const entry of entries) {
    const where = `${entry.file}:${entry.line}`;
    if (!KEY_FORMAT.test(entry.key)) {
      errors.push(`${where} : clé invalide « ${entry.key} »`);
      continue;
    }
    if (entry.text === "") {
      errors.push(`${where} : texte vide pour « ${entry.key} »`);
      continue;
    }
    const previous = seen.get(entry.key);
    if (previous) {
      errors.push(
        `${where} : clé « ${entry.key} » déjà définie dans ${previous.file}:${previous.line}`,
      );
      continue;
    }

    const parts = entry.key.split(".");
    let node: Messages = messages;
    let conflict = false;
    for (const part of parts.slice(0, -1)) {
      const next = node[part];
      if (typeof next === "string") {
        conflict = true;
        break;
      }
      node = next ?? (node[part] = {});
    }
    const last = parts[parts.length - 1];
    if (conflict || typeof node[last] === "object") {
      errors.push(`${where} : « ${entry.key} » entre en conflit avec une autre clé`);
      continue;
    }
    node[last] = entry.text;
    seen.set(entry.key, entry);
  }

  return { messages, errors };
}

/** Files of `textes/` that hold interface texts. */
export function isTextFile(name: string): boolean {
  return name.endsWith(".md") && name.toLowerCase() !== "lisezmoi.md";
}
