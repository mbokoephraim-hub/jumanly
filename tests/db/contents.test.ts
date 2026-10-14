import { afterAll, describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import {
  activeBanners,
  ContentError,
  deleteBanner,
  faqItems,
  listOverrides,
  saveBanner,
  saveFaqItem,
  setFaqItemHidden,
} from "@/server/services/contents";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];

afterAll(async () => {
  await db.contentBlock.deleteMany({ where: { updatedById: { in: users } } });
  await cleanup(users);
  await db.$disconnect();
});

describe("editable contents in the database (/admin/contenus)", () => {
  it("adds a question after the existing ones, edits it, then removes it", async () => {
    const editor = await newUser();
    users.push(editor.id);
    const before = faqItems(messages, await listOverrides(db), "faq.partners", {
      withHidden: true,
    });
    const n = await saveFaqItem(db, editor.id, messages, {
      group: "faq.partners",
      question: "Question de test fictive ?",
      answer: "Réponse de test fictive.",
    });
    expect(n).toBe(Math.max(...before.map((item) => item.n)) + 1);

    await saveFaqItem(db, editor.id, messages, {
      group: "faq.partners",
      n: String(n),
      question: "Question de test fictive revue ?",
      answer: "Réponse de test fictive.",
    });
    let items = faqItems(messages, await listOverrides(db), "faq.partners");
    expect(items.at(-1)).toMatchObject({
      n,
      question: "Question de test fictive revue ?",
      added: true,
    });

    await setFaqItemHidden(db, editor.id, "faq.partners", n, false);
    items = faqItems(messages, await listOverrides(db), "faq.partners");
    expect(items.map((item) => item.n)).not.toContain(n);
  });

  it("hides an original question, then brings it back", async () => {
    const editor = await newUser();
    users.push(editor.id);
    await setFaqItemHidden(db, editor.id, "faq.partners", 1, true);
    expect(
      faqItems(messages, await listOverrides(db), "faq.partners").map((item) => item.n),
    ).not.toContain(1);
    await setFaqItemHidden(db, editor.id, "faq.partners", 1, false);
    expect(faqItems(messages, await listOverrides(db), "faq.partners")[0]?.n).toBe(1);
  });

  it("refuses an empty answer", async () => {
    await expect(
      saveFaqItem(db, "inconnu", messages, {
        group: "faq.partners",
        question: "Question ?",
        answer: "",
      }),
    ).rejects.toBeInstanceOf(ContentError);
  });

  it("publishes and deletes a banner", async () => {
    const editor = await newUser();
    users.push(editor.id);
    const id = await saveBanner(db, editor.id, {
      text: "Bannière de test fictive",
      audience: "partners",
      style: "info",
      start: "",
      end: "",
    });
    const overrides = await listOverrides(db);
    expect(activeBanners(overrides, "partners").map((item) => item.id)).toContain(id);
    expect(activeBanners(overrides, "all").map((item) => item.id)).not.toContain(id);
    await deleteBanner(db, id);
    expect(activeBanners(await listOverrides(db), "partners").map((item) => item.id)).not.toContain(
      id,
    );
  });
});
