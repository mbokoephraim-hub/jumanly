"use server";

import { refresh } from "next/cache";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { sendMessage } from "@/server/services/connect";
import {
  FeedError,
  createPost,
  deletePost,
  feedDigest,
  freshMatches,
  hiringOrganizations,
  latestCertificate,
  whoToFollow,
  replyTo,
  saveFeedImage,
  sendTargets,
  setTypeHidden,
  toggleLike,
  toggleParticipation,
  toggleRepost,
  toggleSave,
  type NewPost,
} from "@/server/services/feed";
import { createReport } from "@/server/services/moderation";
import { feedWords, initialsOf, shortName, toneOf } from "@/components/phone/fil/data";
import { shortTitle } from "@/components/phone/learn/data";
import { formationHome } from "@/server/services/learn-phone";
import { messagesFact } from "@/components/phone/messages/orbi-facts";
import { ORBI_FACTS } from "@/components/phone/orbi-bus";

/**
 * The gestures of the Fil (Modèle B, lot B3). Order of CLAUDE.md: validate → session → service.
 * Each one answers with a small result the screen turns into a toast; nothing throws to the page.
 */
export type FeedResult<T = boolean> = { ok: true; value: T } | { ok: false; error: string };

const PAGE = "/app";
const postId = z.string().trim().min(1).max(60);

async function run<T>(work: (userId: string) => Promise<T>, again = true): Promise<FeedResult<T>> {
  const parsedUser = await requireUser(PAGE);
  try {
    const value = await work(parsedUser.id);
    if (again) refresh();
    return { ok: true, value };
  } catch (error) {
    if (error instanceof FeedError) return { ok: false, error: error.code };
    void reportError(error, { message: "Fil" });
    return { ok: false, error: "failed" };
  }
}

function idOf(raw: unknown) {
  const parsed = postId.safeParse(raw);
  if (!parsed.success) throw new FeedError("invalid");
  return parsed.data;
}

export async function likePostAction(id: string) {
  return run((userId) => toggleLike(db, userId, idOf(id)));
}

export async function repostAction(id: string) {
  return run((userId) => toggleRepost(db, userId, idOf(id)));
}

export async function savePostAction(id: string) {
  return run((userId) => toggleSave(db, userId, idOf(id)));
}

export async function participateAction(id: string) {
  return run((userId) => toggleParticipation(db, userId, idOf(id)));
}

/**
 * « Ne plus voir ce type de publication » (`hide`), or « Annuler » on the masked post. The Fil is
 * not reloaded: the masked line stays in place until the person leaves.
 */
export async function hidePostTypeAction(id: string, hide: boolean) {
  return run((userId) => setTypeHidden(db, userId, idOf(id), hide === true), false);
}

export async function deletePostAction(id: string) {
  return run((userId) => deletePost(db, userId, idOf(id)));
}

export async function replyAction(input: { post: string; body: string }) {
  return run((userId) => replyTo(db, userId, input));
}

const reasons = {
  scam: "scam",
  harassment: "harassment",
  misinformation: "misinformation",
  inappropriate: "inappropriate",
  other: "other",
} as const;

/** « Signaler la publication »: the author is never told who reported. */
export async function reportPostAction(id: string, reason: keyof typeof reasons) {
  const user = await requireUser(PAGE);
  const target = postId.safeParse(id);
  if (!target.success || !(reason in reasons)) return { ok: false as const, error: "invalid" };
  const result = await createReport(db, user.id, {
    targetType: "post",
    targetId: target.data,
    reason: reasons[reason],
  });
  if (result === "notFound") return { ok: false as const, error: "notFound" };
  return { ok: true as const, value: result };
}

/** « Envoyer à une connexion »: the link of the post, in the conversation with that person. */
export async function sendPostAction(id: string, conversationId: string) {
  const user = await requireUser(PAGE);
  const post = postId.safeParse(id);
  const conversation = postId.safeParse(conversationId);
  if (!post.success || !conversation.success) return { ok: false as const, error: "invalid" };
  const targets = await sendTargets(db, user.id);
  const target = targets.find((item) => item.conversationId === conversation.data);
  const row = await db.feedPost.findFirst({
    where: { id: post.data, hiddenAt: null },
    select: { author: { select: { name: true } }, organization: { select: { name: true } } },
  });
  if (!target || !row) return { ok: false as const, error: "notFound" };
  const t = await getTranslations("phoneFil.send");
  try {
    await sendMessage(db, { userId: user.id }, target.conversationId, {
      body: t("message", {
        name: row.organization?.name ?? row.author?.name ?? "",
        link: `/app/fil/${post.data}`,
      }),
    });
  } catch (error) {
    void reportError(error, { message: "Fil · envoyer" });
    return { ok: false as const, error: "failed" };
  }
  return { ok: true as const, value: target.name };
}

/** Publishes a post; returns its id. */
export async function publishAction(input: NewPost) {
  const t = await getTranslations("phoneFil.publish");
  const format = await getFormatter();
  return run((userId) =>
    createPost(db, userId, input, {
      work: t("workDetail"),
      certificate: (date) =>
        t("certificateDetail", {
          date: format.dateTime(date, { day: "numeric", month: "short", year: "numeric" }),
        }),
    }),
  );
}

/** A photo for the post being written (already reduced on the phone). */
export async function uploadFeedImageAction(formData: FormData): Promise<FeedResult<string>> {
  const user = await requireUser(PAGE);
  const file = formData.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "image" };
  try {
    const { token } = await saveFeedImage(db, user.id, new Uint8Array(await file.arrayBuffer()));
    return { ok: true, value: token };
  } catch (error) {
    if (error instanceof FeedError) return { ok: false, error: error.code };
    void reportError(error, { message: "Fil · photo" });
    return { ok: false, error: "failed" };
  }
}

export type OrbiFactCard = {
  href: string;
  title: string;
  sub: string;
  initials: string;
  image: string | null;
  tone: number;
  org: boolean;
};
export type OrbiFactAnswer = {
  question: string;
  text: string;
  cards: OrbiFactCard[];
  action: { href: string; label: string } | null;
};

const facts = z.enum(ORBI_FACTS);

/**
 * Orbi's answers in the Fil that come from the platform's facts (lot B3): the day's news, the
 * offers of the morning, who recruits, whom to follow, a draft about the last attestation. They
 * are built from real data and ask no credit; Orbi proposes, the person decides.
 */
export async function orbiFactAction(raw: string): Promise<OrbiFactAnswer | null> {
  const parsed = facts.safeParse(raw);
  if (!parsed.success) return null;
  const user = await requireUser(PAGE);
  const now = new Date();
  const words = await feedWords(user.id, now);
  const { t } = words;
  const tp = await getTranslations("phone.orbi.fil");
  const list = new Intl.ListFormat("fr", { style: "long", type: "conjunction" });
  const orgCard = (org: { slug: string; name: string; logo: string | null }, sub: string) => {
    const name = shortName(org.name);
    return {
      href: `/app/entreprises/${org.slug}`,
      title: name,
      sub,
      initials: initialsOf(name),
      image: org.logo,
      tone: toneOf(name, true),
      org: true,
    };
  };
  switch (parsed.data) {
    // Messages (lot B8): from the person's own conversations.
    case "nonlus":
    case "prioritaire":
    case "recruteur":
    case "relire": {
      const tm = await getTranslations("phone.orbi.messages");
      const index = ["nonlus", "prioritaire", "recruteur", "relire"].indexOf(parsed.data) + 1;
      return messagesFact(parsed.data, user, tm(`q${index}` as "q1"));
    }
    case "digest": {
      const items = (await feedDigest(db, user.id, now)).map(words.post);
      return {
        question: tp("q1"),
        text: t("orbi.digest", {
          count: items.length,
          names: list.format(items.map((item) => item.author.name)),
        }),
        cards: items.map((item) => ({
          href: item.job?.href ?? item.href,
          title: item.job?.title ?? item.author.name,
          sub: item.job
            ? item.job.score
              ? t("orbi.jobLine", {
                  org: item.author.name,
                  score: item.job.score.replace(/\D+$/, "").trim(),
                })
              : item.author.name
            : [item.tag?.text, item.author.line].filter(Boolean).join(" · "),
          initials: item.author.initials,
          image: item.author.image,
          tone: item.author.tone,
          org: item.author.org,
        })),
        action: null,
      };
    }
    case "offres": {
      const jobs = await freshMatches(db, user.id, now);
      return {
        question: t("orbi.offersTitle", { count: jobs.length }),
        text: t("orbi.offers", { count: jobs.length }),
        cards: jobs.slice(0, 5).map((job) => {
          const org = shortName(job.organization.name);
          return {
            href: `/app/jobs/${job.slug}`,
            title: job.title,
            sub: t("orbi.jobLine", { org, score: String(job.score) }),
            initials: initialsOf(org),
            image: null,
            tone: toneOf(org, true),
            org: true,
          };
        }),
        action: null,
      };
    }
    case "entreprises": {
      const orgs = await hiringOrganizations(db, now);
      return {
        question: tp("q2"),
        text: t("orbi.companies", { count: orgs.length }),
        cards: orgs.map((org) => orgCard(org, t("orbi.companyLine", { count: org.offers }))),
        action: null,
      };
    }
    case "suivre": {
      const people = await whoToFollow(db, user.id, now);
      return {
        question: tp("q3"),
        text: t("orbi.follow", { count: people.length }),
        cards: people.map(({ author }) => {
          const view = words.author(author);
          return {
            href: view.href,
            title: view.name,
            sub: view.line,
            initials: view.initials,
            image: view.image,
            tone: view.tone,
            org: view.org,
          };
        }),
        action: null,
      };
    }
    case "cours": {
      // Formation (lot B7): why the course in progress counts for the person's offers.
      const home = await formationHome(db, user.id, now);
      const tl = await getTranslations("phoneLearn.orbi");
      const current = home.current;
      if (!current)
        return {
          question: tl("noneQuestion"),
          text: tl("none"),
          cards: [],
          action: { href: "/app/learn", label: tl("seeCourses") },
        };
      const course = shortTitle(current.title);
      return {
        question: tl("whyQuestion", { course }),
        text: home.advice
          ? tl("why", {
              company: shortName(home.advice.company),
              job: home.advice.job,
              others: home.advice.offers - 1,
            })
          : tl("whyNoOffer", { course, left: current.leftLessons }),
        cards: [],
        action: {
          href: current.next
            ? `/app/learn/${current.slug}/${current.next.id}`
            : `/app/learn/${current.slug}`,
          label: tl("resume", { course }),
        },
      };
    }
    case "ecrire": {
      const certificate = await latestCertificate(db, user.id);
      const draft = certificate ? t("publish.draft", { course: certificate.courseTitle }) : "";
      return {
        question: tp("q4"),
        text: t("orbi.write", { course: certificate ? "yes" : "none", draft }),
        cards: [],
        action: certificate
          ? { href: "/app/fil/publier?brouillon=attestation", label: t("orbi.openDraft") }
          : null,
      };
    }
  }
}
