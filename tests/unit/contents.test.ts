import { describe, expect, it } from "vitest";
import { activeBanners, bannerSchema, faqItems, listBanners } from "@/server/services/contents";

const messages = {
  faq: { general: { q1: "Question 1 ?", a1: "Réponse 1.", q2: "Question 2 ?", a2: "Réponse 2." } },
};
const banner = (value: object) =>
  JSON.stringify({ audience: "all", style: "info", start: "", end: "", ...value });

describe("editable FAQ (/admin/contenus)", () => {
  it("shows the original texts when nothing was edited", () => {
    const items = faqItems(messages, {}, "faq.general");
    expect(items.map((item) => item.question)).toEqual(["Question 1 ?", "Question 2 ?"]);
    expect(items.every((item) => !item.edited && !item.added)).toBe(true);
  });

  it("replaces, hides and adds questions", () => {
    const overrides = {
      "faq.general.a1": "Réponse revue.",
      "faq.general.q2": "",
      "faq.general.q5": "Nouvelle question ?",
      "faq.general.a5": "Nouvelle réponse.",
    };
    const shown = faqItems(messages, overrides, "faq.general");
    expect(shown.map((item) => [item.n, item.answer])).toEqual([
      [1, "Réponse revue."],
      [5, "Nouvelle réponse."],
    ]);
    expect(shown[1]).toMatchObject({ added: true, edited: true });
    // The admin still lists the hidden question, under its original wording.
    const all = faqItems(messages, overrides, "faq.general", { withHidden: true });
    expect(all.find((item) => item.n === 2)).toMatchObject({
      hidden: true,
      question: "Question 2 ?",
    });
  });

  it("does not mix groups", () => {
    expect(
      faqItems(messages, { "home.faq.q1": "Accueil ?", "home.faq.a1": "Oui." }, "faq.general"),
    ).toHaveLength(2);
  });
});

describe("banners", () => {
  const now = new Date("2026-10-14T12:00:00Z");

  it("shows a banner to its public, between its dates (whole days)", () => {
    const overrides = {
      "banner.a": banner({ text: "Pour tous", end: "2026-10-14" }),
      "banner.b": banner({ text: "Recruteurs", audience: "recruiters" }),
      "banner.c": banner({ text: "Plus tard", start: "2026-10-15" }),
      "banner.d": banner({ text: "Fini", end: "2026-10-13" }),
      "faq.general.q1": "pas une bannière",
    };
    expect(activeBanners(overrides, "all", now).map((item) => item.text)).toEqual(["Pour tous"]);
    expect(activeBanners(overrides, "recruiters", now).map((item) => item.text)).toEqual([
      "Pour tous",
      "Recruteurs",
    ]);
    expect(listBanners(overrides)).toHaveLength(4);
  });

  it("ignores a damaged value and refuses an end before the start", () => {
    expect(listBanners({ "banner.x": "{pas du json" })).toEqual([]);
    expect(
      bannerSchema.safeParse({
        text: "Texte",
        audience: "all",
        start: "2026-10-15",
        end: "2026-10-14",
      }).success,
    ).toBe(false);
  });
});
