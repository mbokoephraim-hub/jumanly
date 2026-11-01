/**
 * The text under a video lesson, put in order for the phone (Ephraïm, 01/11/2026): a short
 * « Résumé », then « Notions clés », one notion per point the admin wrote.
 *
 * A point is a line (or a piece of a line) starting with « ► », « ▶ », « • », « - », « * », « – »
 * or « 1. ». « Titre : explication » gives the notion its own title; otherwise the notion is only
 * its text. What comes before the first point is the summary. A text without points is all summary.
 */
export type LessonNotion = { title: string | null; text: string };
export type LessonNotes = { summary: string | null; notions: LessonNotion[] };

const MARK = /^(?:[►▶•*–-]|\d{1,2}[.)])\s+/u;

/** « une colonne… » after « Titre : » starts with a capital under its own title. */
const capital = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);

function notion(raw: string): LessonNotion | null {
  const text = raw.replace(MARK, "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  const titled = /^(.{3,70}?)\s*:\s+(.+)$/u.exec(text);
  if (titled && !/[.!?]/u.test(titled[1]!))
    return { title: titled[1]!.trim(), text: capital(titled[2]!.trim()) };
  return { title: null, text };
}

export function lessonNotes(value: string | null): LessonNotes {
  const lines = (value ?? "")
    // « ► Un point. ► Un autre. » written on one line: one point each.
    .replace(/\s+(?=[►▶•]\s)/gu, "\n")
    .split(/\r?\n/)
    .map((line) => line.trim());

  const before: string[] = [];
  const notions: LessonNotion[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (MARK.test(line)) {
      const found = notion(line);
      if (found) notions.push(found);
    } else if (notions.length === 0) {
      before.push(line);
    } else {
      // A line under a point continues it.
      const last = notions[notions.length - 1]!;
      last.text = `${last.text} ${line}`;
    }
  }
  const summary = before.join("\n\n").trim() || null;
  return { summary, notions };
}
