import { z } from "zod";

/** A post, with or without a photo (Ephraïm, 22/10/2026): short, like a status. */
export const FEED_POST_MAX = 220;
/** A comment: at most this many characters. */
export const FEED_REPLY_MAX = 2000;
/** Its hook line (docs/fil-menu-publication § 2): two lines, 30 to 50 characters advised. */
export const FEED_TITLE_MAX = 60;
/** Its text: about 120 characters. Title and text together stay within FEED_POST_MAX. */
export const FEED_BODY_MAX = 160;
/** The text's gauge: « Encore un peu » below, « Bonne longueur » up to FEED_BODY_GOOD_MAX. */
export const FEED_BODY_GOOD_MIN = 90;
export const FEED_BODY_GOOD_MAX = 150;

/** The title and the text of a new post, checked the same way on the phone and on the server. */
export const postTextSchema = z.object({
  title: z.string().trim().min(1).max(FEED_TITLE_MAX),
  body: z.string().trim().max(FEED_BODY_MAX).default(""),
});

/** Where the text stands on its gauge. */
export function bodyLength(length: number): "short" | "good" | "long" {
  if (length < FEED_BODY_GOOD_MIN) return "short";
  if (length <= FEED_BODY_GOOD_MAX) return "good";
  return "long";
}
