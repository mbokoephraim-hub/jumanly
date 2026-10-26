import { describe, expect, it } from "vitest";
import {
  FEED_BODY_MAX,
  FEED_POST_MAX,
  FEED_TITLE_MAX,
  bodyLength,
  postTextSchema,
} from "@/server/services/feed-limits";

// docs/fil-menu-publication § 2: a title (60) and a text (160) for each new post.
describe("Limites d'une publication du Fil", () => {
  it("titre 60 et texte 160 : 220 au plus, la limite déjà décidée", () => {
    expect(FEED_TITLE_MAX).toBe(60);
    expect(FEED_BODY_MAX).toBe(160);
    expect(FEED_TITLE_MAX + FEED_BODY_MAX).toBe(FEED_POST_MAX);
  });

  it("exige un titre, accepte un texte vide, refuse ce qui dépasse", () => {
    expect(postTextSchema.safeParse({ title: "Un titre", body: "" }).success).toBe(true);
    expect(postTextSchema.safeParse({ title: "   ", body: "Un texte" }).success).toBe(false);
    expect(postTextSchema.safeParse({ title: "t".repeat(60) }).success).toBe(true);
    expect(postTextSchema.safeParse({ title: "t".repeat(61) }).success).toBe(false);
    expect(postTextSchema.safeParse({ title: "Titre", body: "a".repeat(160) }).success).toBe(true);
    expect(postTextSchema.safeParse({ title: "Titre", body: "a".repeat(161) }).success).toBe(false);
  });

  it("guide la longueur du texte vers 120 caractères", () => {
    expect(bodyLength(40)).toBe("short");
    expect(bodyLength(89)).toBe("short");
    expect(bodyLength(90)).toBe("good");
    expect(bodyLength(150)).toBe("good");
    expect(bodyLength(151)).toBe("long");
  });
});
