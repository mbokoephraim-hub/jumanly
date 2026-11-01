import { describe, expect, it } from "vitest";
import { lessonNotes } from "@/server/services/lesson-notes";

describe("lessonNotes", () => {
  it("keeps a text without points as the summary", () => {
    expect(lessonNotes("Une leçon courte.\nSur deux lignes.")).toEqual({
      summary: "Une leçon courte.\n\nSur deux lignes.",
      notions: [],
    });
  });

  it("turns the « ► » lines into notions, with a title before « : »", () => {
    const notes = lessonNotes(
      "En 14 minutes, votre premier rapport.\n\n► Power Query : importer et transformer.\n► Ensuite nous verrons ce qu’est la modélisation.\nAvec DAX.",
    );
    expect(notes.summary).toBe("En 14 minutes, votre premier rapport.");
    expect(notes.notions).toEqual([
      { title: "Power Query", text: "Importer et transformer." },
      { title: null, text: "Ensuite nous verrons ce qu’est la modélisation. Avec DAX." },
    ]);
  });

  it("splits points written on one line and reads numbered points", () => {
    expect(lessonNotes("► Un. ► Deux.").notions.map((n) => n.text)).toEqual(["Un.", "Deux."]);
    expect(lessonNotes("1. Premier\n2) Second").notions.map((n) => n.text)).toEqual([
      "Premier",
      "Second",
    ]);
  });

  it("does not take a sentence ending before « : » as a title", () => {
    expect(lessonNotes("► Vous verrez. Trois choses : A, B.").notions[0]?.title).toBeNull();
  });

  it("is empty without text", () => {
    expect(lessonNotes(null)).toEqual({ summary: null, notions: [] });
  });
});
