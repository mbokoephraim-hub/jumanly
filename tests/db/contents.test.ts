import { afterAll, describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import {
  activeBanners,
  ContentError,
  contentVersions,
  deleteBanner,
  listTips,
  publishedTips,
  restoreVersion,
  saveTip,
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
  await db.contentVersion.deleteMany({ where: { createdById: { in: users } } });
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

  it("garde la version précédente et la restaure (Admin v2, étape 8)", async () => {
    const editor = await newUser();
    users.push(editor.id);
    const n = await saveFaqItem(db, editor.id, messages, {
      group: "faq.partners",
      question: "Question fictive version 1 ?",
      answer: "Réponse fictive version 1.",
      reason: "Première version",
    });
    await saveFaqItem(db, editor.id, messages, {
      group: "faq.partners",
      n: String(n),
      question: "Question fictive version 2 ?",
      answer: "Réponse fictive version 2.",
      reason: "Deuxième version",
    });
    const item = `faq.partners.q${n}`;
    const versions = await contentVersions(db, item);
    expect(versions[0]?.previous[item]).toBe("Question fictive version 1 ?");
    expect(versions[0]?.reason).toBe("Deuxième version");
    expect(versions[1]?.previous[item]).toBeNull();

    await restoreVersion(db, editor.id, versions[0]!.id, "Retour à la première version");
    expect((await listOverrides(db))[item]).toBe("Question fictive version 1 ?");
    // The restore kept the version it replaced: it can itself be undone.
    expect((await contentVersions(db, item))[0]?.previous[item]).toBe(
      "Question fictive version 2 ?",
    );
    // Back to the first version of all: no override, the question disappears.
    await restoreVersion(db, editor.id, versions[1]!.id, "Retirer la question");
    expect(await listOverrides(db)).not.toHaveProperty(item);
  });

  it("écrit et publie une fiche conseil", async () => {
    const editor = await newUser();
    users.push(editor.id);
    const before = listTips(messages, await listOverrides(db));
    expect(before.find((tip) => tip.id === "salary")?.title).toBe(messages.career.tips.salary);
    await expect(
      saveTip(db, editor.id, { id: "salary", title: "Titre", body: "Trop court", minutes: "3" }),
    ).rejects.toBeInstanceOf(ContentError);
    const id = await saveTip(db, editor.id, {
      title: "Fiche de test fictive",
      body: "Un texte de fiche fictif, assez long pour être publié.",
      minutes: "4",
      published: "on",
    });
    const tips = publishedTips(messages, await listOverrides(db));
    expect(tips.find((tip) => tip.id === id)).toMatchObject({ minutes: 4, published: true });
    await restoreVersion(
      db,
      editor.id,
      (await contentVersions(db, `tips.${id}`))[0]!.id,
      "Fiche retirée",
    );
    expect(publishedTips(messages, await listOverrides(db)).map((tip) => tip.id)).not.toContain(id);
  });
});
