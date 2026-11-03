/**
 * « Vue » of an offer (Ephraïm, 03/11/2026): where the offer stands against its goal (the posts to
 * fill before the closing date), and Orbi's reading of its figures. A fixed rule on the offer's
 * own counts, never on who the candidates are; it advises, the recruiter acts.
 */

export type OfferFigures = {
  views: number;
  applications: number;
  /** Applications not opened yet. */
  unseen: number;
  shortlisted: number;
  hired: number;
  /** Posts to fill (Job.openings). */
  openings: number;
  /** Days online, and days left before closing (null without a closing date). */
  online: number;
  left: number | null;
  /** Mean days before a first answer (null without any). */
  responseDays: number | null;
  invited: number;
};

/** Below this share of views turned into applications, the offer « attracts but does not convince ». */
export const LOW_RATE = 0.05;
/** Fewer views than this after three days online: the offer is not seen enough. */
export const FEW_VIEWS = 20;
/** Retained candidates wished per post before the interviews. */
export const SHORTLIST_PER_POST = 3;
/** First answer later than this many days: candidates wait too long. */
export const SLOW_ANSWER_DAYS = 5;

export type OfferVerdict = "filled" | "late" | "unseen" | "unconvincing" | "toSort" | "onTrack";
export type OfferTone = "good" | "watch" | "bad";

/** The one line at the top: the most urgent thing first. */
export function offerVerdict(input: OfferFigures): { verdict: OfferVerdict; tone: OfferTone } {
  const rate = input.views > 0 ? input.applications / input.views : 0;
  if (input.hired >= input.openings) return { verdict: "filled", tone: "good" };
  if (input.left !== null && input.left <= 5 && input.shortlisted < input.openings)
    return { verdict: "late", tone: "bad" };
  if (input.online >= 3 && input.views < FEW_VIEWS) return { verdict: "unseen", tone: "bad" };
  if (input.views >= 30 && rate < LOW_RATE) return { verdict: "unconvincing", tone: "watch" };
  if (input.unseen > 0) return { verdict: "toSort", tone: "watch" };
  return { verdict: "onTrack", tone: "good" };
}

export type OfferPoint =
  | { key: "rate"; share: number }
  | { key: "seen"; views: number }
  | { key: "fastAnswer"; days: number }
  | { key: "shortlist"; count: number }
  | { key: "lowRate"; share: number }
  | { key: "fewViews"; views: number }
  | { key: "slowAnswer"; days: number }
  | { key: "noInvite" }
  | { key: "open"; count: number }
  | { key: "retain"; wanted: number }
  | { key: "closing"; days: number }
  | { key: "noApplication" };

/** « Ce qui marche », « À améliorer », « À faire » (same blocks as « Évaluation » of a candidate). */
export function offerPoints(input: OfferFigures): {
  works: OfferPoint[];
  improve: OfferPoint[];
  todo: OfferPoint[];
} {
  const rate = input.views > 0 ? input.applications / input.views : 0;
  const works: OfferPoint[] = [];
  const improve: OfferPoint[] = [];
  const todo: OfferPoint[] = [];
  if (input.applications > 0 && rate >= LOW_RATE) works.push({ key: "rate", share: rate });
  if (input.views >= FEW_VIEWS) works.push({ key: "seen", views: input.views });
  if (input.responseDays !== null && input.responseDays <= SLOW_ANSWER_DAYS)
    works.push({ key: "fastAnswer", days: input.responseDays });
  if (input.shortlisted > 0) works.push({ key: "shortlist", count: input.shortlisted });

  if (input.views >= 30 && rate < LOW_RATE) improve.push({ key: "lowRate", share: rate });
  if (input.online >= 3 && input.views < FEW_VIEWS)
    improve.push({ key: "fewViews", views: input.views });
  if (input.responseDays !== null && input.responseDays > SLOW_ANSWER_DAYS)
    improve.push({ key: "slowAnswer", days: input.responseDays });
  if (input.invited === 0 && input.hired < input.openings) improve.push({ key: "noInvite" });

  if (input.unseen > 0) todo.push({ key: "open", count: input.unseen });
  const wanted = input.openings * SHORTLIST_PER_POST;
  if (input.applications > 0 && input.shortlisted < wanted && input.hired < input.openings)
    todo.push({ key: "retain", wanted: Math.min(wanted, input.applications) - input.shortlisted });
  if (input.left !== null && input.left >= 0 && input.left <= 7)
    todo.push({ key: "closing", days: input.left });
  if (input.applications === 0) todo.push({ key: "noApplication" });
  return { works, improve, todo: todo.filter((item) => item.key !== "retain" || item.wanted > 0) };
}
