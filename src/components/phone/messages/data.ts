import "server-only";
import { clockParts } from "@/lib/clock-parts";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { reactionsOf, ringColors } from "@/server/services/chat";
import { attachableDocuments } from "@/server/services/conversation-attachments";
import { isOnline } from "@/server/services/hire-messaging";
import { similarJobs } from "@/server/services/jobs";
import { decisionParagraphs } from "@/server/services/message-templates";
import {
  type Counterpart,
  type InboxItem,
  type InboxOrganization,
  type InboxPerson,
  type LastMessage,
  type PhoneConversation,
} from "@/server/services/messages-phone";
import { initialsOf, shortName, toneOf } from "../fil/data";
import type { AttachDoc, Bubble, InboxRow, MessageView, ThreadView, WhoView } from "./types";

const DAY = 86_400_000;

type Payload = {
  link?: string;
  /** A post of the Fil shared from « Partager »: its id (the name is its author's). */
  post?: string;
  files?: { key?: string; width?: number; height?: number }[];
  hd?: boolean;
  key?: string;
  seconds?: number;
  upload?: { key?: string; name?: string; size?: number; type?: string };
  document?: { type?: string; title?: string };
  userId?: string;
  name?: string;
  line?: string;
  image?: string | null;
  slug?: string;
  orgId?: string;
  logo?: string | null;
  startsAt?: string;
  timezone?: string;
  note?: string;
  slots?: string[];
  address?: string;
  geo?: { lat?: number; lng?: number };
  interviewId?: string;
  ephemeral?: { by?: string; seconds?: number | null };
  certificate?: { code?: string; title?: string; hours?: number };
  outcome?: string;
  retracted?: boolean;
  signer?: string;
};

const payloadOf = (value: Prisma.JsonValue): Payload =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Payload) : {};

export const mediaSrc = (conversationId: string, messageId: string, index = 0) =>
  `/app/messages/${conversationId}/media/${messageId}?i=${index}`;

/** « 120 Ko », « 1,4 Mo ». */
function sizeOf(bytes: number, format: Awaited<ReturnType<typeof getFormatter>>) {
  if (bytes < 1024 * 1024) return `${format.number(Math.max(1, Math.round(bytes / 1024)))} Ko`;
  return `${format.number(Math.round((bytes / 1024 / 1024) * 10) / 10)} Mo`;
}

/** « 0:24 ». */
export const durationOf = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, "0")}`;

/** An address of Jumanly kept inside the space: an offer opens in Explorer. */
function insideHref(url: string) {
  try {
    const parsed = new URL(url, "https://jumanly.io");
    if (!/(^|\.)jumanly\.io$/.test(parsed.hostname) && !url.startsWith("/")) return null;
    const offer = parsed.pathname.match(/^\/offres\/([\w-]+)$/);
    if (offer) return `/app/jobs/${offer[1]}`;
    return parsed.pathname.startsWith("/app") ? parsed.pathname + parsed.search : parsed.pathname;
  } catch {
    return null;
  }
}

function displayOf(url: string) {
  try {
    const parsed = new URL(url, "https://jumanly.io");
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

/** The words of Messages and the ways dates are shown, read once per page. */
export async function messageWords(viewer: { showPresence: boolean }, now = new Date()) {
  const t = await getTranslations("phoneMsg");
  const format = await getFormatter();
  const dayKey = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - DAY));
  const clock = (date: Date) => format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const dayMonth = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });

  /** « 09:42 », « Hier », « Lun. », « 18 oct. ». */
  const when = (date: Date) => {
    const key = dayKey(date);
    if (key === today) return clock(date);
    if (key === yesterday) return t("time.yesterday");
    if (now.getTime() - date.getTime() < 6 * DAY)
      return capital(format.dateTime(date, { weekday: "short" }));
    return dayMonth(date);
  };

  const seen = (date: Date) => {
    const key = dayKey(date);
    if (key === today) return t("status.seenAt", { time: clock(date) });
    if (key === yesterday) return t("status.seenYesterday", { time: clock(date) });
    return t("status.seenOn", { date: dayMonth(date) });
  };

  const orgLine = (org: InboxOrganization) => [org.sector, org.city].filter(Boolean).join(" · ");

  const personLine = (person: InboxPerson) => {
    const job = person.talentProfile?.experiences[0];
    if (job?.title && job.company) return t("who.job", { title: job.title, company: job.company });
    if (person.talentProfile?.headline) return person.talentProfile.headline;
    const title = person.talentProfile?.desiredJobTitles[0];
    const place = person.talentProfile?.desiredLocations[0];
    return [title, place].filter(Boolean).join(" · ");
  };

  const ofOrganization = (org: InboxOrganization): WhoView => {
    const name = shortName(org.name);
    return {
      name,
      first: name,
      initials: initialsOf(name),
      image: org.logo,
      tone: toneOf(name, true),
      org: true,
      verified: Boolean(org.verifiedAt),
      online: false,
      line: orgLine(org),
      status: t("status.company"),
      href: `/app/entreprises/${org.slug}`,
      personId: null,
      ring: ringColors(org.name),
    };
  };

  const ofPerson = (
    person: InboxPerson,
    organization: InboxOrganization | null,
    recruiterTitle?: string | null,
  ): WhoView => {
    const online = isOnline(person, viewer, now);
    const visible = person.showPresence && viewer.showPresence && person.lastSeenAt;
    const org = organization ? shortName(organization.name) : null;
    return {
      name: person.name,
      first: person.firstName || person.name.split(/\s+/)[0] || person.name,
      initials: initialsOf(person.name),
      image: person.image,
      tone: toneOf(person.name, false),
      org: false,
      verified: Boolean(person.emailVerified),
      online,
      line: org
        ? t("who.job", { title: recruiterTitle || t("who.recruiter"), company: org })
        : personLine(person),
      status: online ? t("status.online") : visible ? seen(person.lastSeenAt!) : "",
      href: organization ? `/app/entreprises/${organization.slug}` : `/app/personnes/${person.id}`,
      personId: person.id,
      ring: ringColors(
        person.name,
        person.talentProfile?.skills.map((row) => row.skill.name) ?? [],
      ),
    };
  };

  const ofCounterpart = (counterpart: Counterpart, recruiterTitle?: string | null) =>
    counterpart.kind === "organization"
      ? ofOrganization(counterpart.organization)
      : ofPerson(counterpart.person, counterpart.organization, recruiterTitle);

  /** The line under a name in the list: « Vous : Merci ! », « Photo », « Note vocale · 0:24 ». */
  const preview = (last: LastMessage | null, userId: string, me: string) => {
    if (!last) return t("preview.none");
    const payload = payloadOf(last.payload);
    let text: string;
    switch (last.kind) {
      case "image":
        text = t("preview.photos", { count: payload.files?.length ?? 1 });
        break;
      case "voice":
        text = t("preview.voice", { duration: durationOf(payload.seconds ?? 0) });
        break;
      case "contact":
        text = t("preview.contact", { name: payload.name ?? last.body });
        break;
      case "organization":
        text = t("preview.org", { name: shortName(payload.name ?? last.body) });
        break;
      case "text":
        text = payload.post && payload.name ? t("preview.post", { name: payload.name }) : last.body;
        break;
      case "file":
        text = t("preview.doc", {
          name:
            payload.upload?.name ??
            payload.document?.title ??
            payload.certificate?.title ??
            last.body,
        });
        break;
      case "slot":
        text = t("preview.event", { label: t("event.slot"), when: last.body });
        break;
      case "invitation":
        text = t("preview.event", { label: t("event.interview"), when: last.body });
        break;
      case "system":
        return payload.ephemeral ? systemLine(payload, userId, me) : last.body;
      case "decision":
        return payload.outcome === "hired" ? t("preview.hired") : t("preview.rejected");
      default:
        text = last.body;
    }
    return last.senderId === userId ? t("preview.mine", { text }) : text;
  };

  const ephemeralLabel = (seconds: number | null | undefined) =>
    seconds === 86_400
      ? t("ephemeral.day")
      : seconds === 7 * 86_400
        ? t("ephemeral.week")
        : seconds === 90 * 86_400
          ? t("ephemeral.quarter")
          : t("ephemeral.off");

  /** « Vous avez activé les messages éphémères : 24 heures » for the one who did it. */
  function systemLine(payload: Payload, userId: string, otherName: string) {
    const by = payload.ephemeral?.by;
    const seconds = payload.ephemeral?.seconds ?? null;
    const mine = by === userId;
    if (seconds)
      return mine
        ? t("ephemeral.lineMineOn", { duration: ephemeralLabel(seconds) })
        : t("ephemeral.lineOn", { name: otherName, duration: ephemeralLabel(seconds) });
    return mine ? t("ephemeral.lineMineOff") : t("ephemeral.lineOff", { name: otherName });
  }

  const row = (item: InboxItem, userId: string, title?: string | null): InboxRow => {
    const who = ofCounterpart(item.counterpart, title);
    return {
      id: item.id,
      tab: item.tab,
      who,
      time: item.last ? when(item.last.createdAt) : "",
      preview: preview(item.last, userId, who.first),
      unread: item.unread,
      muted: item.muted,
      pinned: item.pinned,
      typing: item.typing,
      lastMine: item.last?.senderId === userId,
      lastRead: item.lastRead,
      voice: item.last?.kind === "voice",
    };
  };

  return {
    t,
    format,
    when,
    clock,
    dayMonth,
    ofPerson,
    ofOrganization,
    ofCounterpart,
    preview,
    row,
    systemLine,
    ephemeralLabel,
    orgLine,
  };
}

export type MessageWords = Awaited<ReturnType<typeof messageWords>>;

/** The job titles of the recruiters who wrote, for « Recruteuse · Baobab Fintech ». */
export async function recruiterTitles(db: PrismaClient, items: InboxItem[]) {
  const pairs = items.flatMap((item) =>
    item.counterpart.kind === "person" && item.counterpart.organization
      ? [{ userId: item.counterpart.person.id, organizationId: item.counterpart.organization.id }]
      : [],
  );
  if (pairs.length === 0) return new Map<string, string | null>();
  const rows = await db.membership.findMany({
    where: { OR: pairs },
    select: { userId: true, organizationId: true, jobTitle: true },
  });
  return new Map(rows.map((row) => [`${row.userId}:${row.organizationId}`, row.jobTitle]));
}

export function titleOf(titles: Map<string, string | null>, item: InboxItem) {
  return item.counterpart.kind === "person" && item.counterpart.organization
    ? (titles.get(`${item.counterpart.person.id}:${item.counterpart.organization.id}`) ?? null)
    : null;
}

/** The bubbles of one conversation, worded for the person who reads it. */
export async function messageViews(
  db: PrismaClient,
  words: MessageWords,
  conversation: PhoneConversation,
  userId: string,
  other: WhoView,
): Promise<MessageView[]> {
  const { t, format } = words;
  const id = conversation.item.id;
  const interviewIds = conversation.messages.flatMap((message) => {
    const value = payloadOf(message.payload).interviewId;
    return message.kind === "invitation" && value ? [value] : [];
  });
  const contactIds = conversation.messages.flatMap((message) => {
    const value = payloadOf(message.payload).userId;
    return message.kind === "contact" && value ? [value] : [];
  });
  const postIds = conversation.messages.flatMap((message) => {
    const value = payloadOf(message.payload).post;
    return message.kind === "text" && typeof value === "string" ? [value] : [];
  });
  const decisions = conversation.messages.filter((message) => message.kind === "decision");
  const lastDecision = decisions.at(-1);
  const signerIds = [
    ...new Set(decisions.flatMap((message) => (message.senderId ? [message.senderId] : []))),
  ];
  const [interviews, people, signers, similar, tc, ts, th, tch, reactions, posts] =
    await Promise.all([
      interviewIds.length
        ? db.interview.findMany({
            where: { id: { in: interviewIds } },
            select: {
              id: true,
              status: true,
              startsAt: true,
              slots: true,
              timezone: true,
              mode: true,
              address: true,
              link: true,
              durationMinutes: true,
            },
          })
        : Promise.resolve([]),
      contactIds.length
        ? db.user.findMany({ where: { id: { in: contactIds } }, select: { id: true, image: true } })
        : Promise.resolve([]),
      signerIds.length
        ? db.user.findMany({ where: { id: { in: signerIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      // After a « no », the jobs close to the one applied to (as on the computer).
      lastDecision && payloadOf(lastDecision.payload).outcome !== "hired" && conversation.jobSlug
        ? db.job
            .findUnique({
              where: { slug: conversation.jobSlug },
              select: { slug: true, contractType: true, country: true },
            })
            .then((job) => (job ? similarJobs(db, job, 3) : []))
        : Promise.resolve([]),
      getTranslations("connect.decision"),
      getTranslations("suivi.similar"),
      getTranslations(),
      getTranslations("phoneChat"),
      reactionsOf(
        db,
        conversation.messages.map((message) => message.id),
        userId,
      ),
      // The posts shared from the Fil, read again: a post taken down or deleted is not shown.
      postIds.length
        ? db.feedPost.findMany({
            where: { id: { in: postIds }, hiddenAt: null },
            select: {
              id: true,
              title: true,
              body: true,
              imageUrl: true,
              imageAlt: true,
              author: { select: { name: true, image: true } },
              organization: { select: { name: true, logo: true } },
            },
          })
        : Promise.resolve([]),
    ]);
  /** « Jeudi 29 octobre · 10 h », in the time zone of the interview. */
  const interviewTitle = (date: Date, timeZone?: string) => {
    const zone = timeZone ? { timeZone } : {};
    const day = format.dateTime(date, { weekday: "long", day: "numeric", month: "long", ...zone });
    const { hour, minute } = clockParts(date, timeZone);
    return tch("interview.title", {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hour: minute
        ? tch("interview.hourMinutes", { hour, minute: String(minute).padStart(2, "0") })
        : tch("interview.hour", { hour }),
    });
  };
  const longDate = (date: Date, timeZone?: string) => {
    const text = format.dateTime(date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    });
    return (text.charAt(0).toUpperCase() + text.slice(1)).replace(/ à (\d+):00$/, ", $1 h");
  };

  const bubbleOf = (message: PhoneConversation["messages"][number]): Bubble => {
    const payload = payloadOf(message.payload);
    if (message.hiddenAt)
      return {
        kind: "system",
        text: th(payload.retracted ? "hireCandidates.retracted" : "report.hidden"),
      };
    switch (message.kind) {
      case "decision": {
        const hired = payload.outcome === "hired";
        const signer =
          payload.signer ?? signers.find((row) => row.id === message.senderId)?.name ?? other.name;
        return {
          kind: "decision",
          hired,
          title: hired ? tc("hired") : tc("rejected"),
          paragraphs: decisionParagraphs(message.body),
          signer: tc("signer", { name: signer }),
          bounce:
            !hired && message.id === lastDecision?.id
              ? similar.length
                ? {
                    title: ts("title"),
                    text: ts("text", { count: similar.length }),
                    href: "/app/jobs?vue=recentes",
                    cta: ts("cta"),
                  }
                : {
                    title: ts("title"),
                    text: tc("bounce.trainLine"),
                    href: "/app/career/entretiens/nouveau",
                    cta: tc("bounce.train"),
                  }
              : null,
        };
      }
      case "system":
        return {
          kind: "system",
          text: payload.ephemeral ? words.systemLine(payload, userId, other.first) : message.body,
        };
      case "image":
        return {
          kind: "photos",
          hd: Boolean(payload.hd),
          photos: (payload.files ?? []).map((file, index) => ({
            src: mediaSrc(id, message.id, index),
            width: file.width ?? 1280,
            height: file.height ?? 960,
          })),
        };
      case "voice":
        return {
          kind: "voice",
          src: mediaSrc(id, message.id),
          seconds: payload.seconds ?? 0,
          duration: durationOf(payload.seconds ?? 0),
        };
      case "contact": {
        const name = payload.name ?? message.body;
        return {
          kind: "contact",
          name,
          line: payload.line ?? "",
          initials: initialsOf(name),
          image: people.find((person) => person.id === payload.userId)?.image ?? null,
          tone: toneOf(name, false),
          href: payload.userId ? `/app/personnes/${payload.userId}` : null,
        };
      }
      case "organization": {
        const name = shortName(payload.name ?? message.body);
        return {
          kind: "org",
          name,
          line: payload.line ?? "",
          initials: initialsOf(name),
          image: payload.logo ?? null,
          tone: toneOf(name, true),
          href: `/app/entreprises/${payload.slug ?? ""}`,
        };
      }
      case "file": {
        if (payload.certificate?.code)
          return {
            kind: "doc",
            name: tch("attach.certificateName", {
              title: payload.certificate.title ?? message.body,
            }),
            meta: tch("attach.certificateMeta"),
            ext: t("pdf"),
            href: `/attestations/${payload.certificate.code}`,
          };
        if (payload.upload) {
          const pdf = payload.upload.type === "application/pdf";
          const word = payload.upload.type?.includes("wordprocessingml") ?? false;
          return {
            kind: "doc",
            name: payload.upload.name ?? message.body,
            meta: sizeOf(payload.upload.size ?? 0, format),
            ext: pdf
              ? "PDF"
              : word
                ? "DOCX"
                : (payload.upload.type?.split("/")[1] ?? "").toUpperCase(),
            href: mediaSrc(id, message.id),
          };
        }
        return {
          kind: "doc",
          name: payload.document?.title ?? message.body,
          meta: payload.document?.type === "cv" ? t("doc.cv") : t("doc.text"),
          ext: "PDF",
          href: `/app/messages/${id}/document/${message.id}`,
        };
      }
      case "slot": {
        const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
        const slots = (payload.slots ?? []).map((value) => new Date(value));
        const hour = (date: Date) =>
          format
            .dateTime(date, {
              hour: "numeric",
              minute: "2-digit",
              ...(payload.timezone ? { timeZone: payload.timezone } : {}),
            })
            .replace(/^(\d+):00$/, "$1 h")
            .replace(/^(\d+):(\d+)$/, "$1 h $2");
        const dayOnly = (date: Date) => {
          const text = format.dateTime(date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            ...(payload.timezone ? { timeZone: payload.timezone } : {}),
          });
          return text.charAt(0).toUpperCase() + text.slice(1);
        };
        const geo =
          typeof payload.geo?.lat === "number" && typeof payload.geo?.lng === "number"
            ? `${payload.geo.lat},${payload.geo.lng}`
            : null;
        const place = geo ?? payload.address ?? null;
        const several = slots.length > 1;
        return {
          kind: "event",
          label: t("event.slot"),
          title:
            several && startsAt
              ? dayOnly(startsAt)
              : startsAt
                ? longDate(startsAt, payload.timezone)
                : message.body,
          meta: [
            several ? t("event.hours", { hours: slots.map(hour).join(" · ") }) : null,
            payload.note ?? null,
            payload.address ?? null,
          ]
            .filter(Boolean)
            .join(" · "),
          extra: payload.link?.match(/^https?:\/\//i)
            ? { href: payload.link, label: t("event.join") }
            : place
              ? {
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`,
                  label: t("event.map"),
                }
              : null,
          action: startsAt
            ? {
                href: `/app/messages/${id}/agenda/${message.id}`,
                label: t("event.agenda"),
                download: true,
              }
            : null,
        };
      }
      case "invitation": {
        const interview = interviews.find((row) => row.id === payload.interviewId);
        if (!interview) return { kind: "text", text: message.body };
        const confirmed = Boolean(interview.status === "confirmed" && interview.startsAt);
        const first = interview.startsAt ?? interview.slots[0] ?? null;
        const place =
          interview.mode === "onsite" && interview.address
            ? interview.address
            : tch(`interview.mode.${interview.mode}`);
        return {
          kind: "interview",
          id: interview.id,
          title: first ? interviewTitle(first, interview.timezone) : message.body,
          meta: confirmed
            ? tch("interview.meta", { place, minutes: interview.durationMinutes })
            : tch("interview.toConfirm", { minutes: interview.durationMinutes }),
          confirmed,
          agendaHref: confirmed ? `/app/suivi/entretiens/${interview.id}/agenda` : null,
          chooseHref: confirmed ? null : `/app/suivi/entretiens/${interview.id}`,
          practiceHref: conversation.application
            ? `/app/career/entretiens/nouveau?candidature=${conversation.application.id}`
            : "/app/career/entretiens/nouveau",
        };
      }
      case "document_request":
        return {
          kind: "text",
          text: t("bubble.docRequest", { name: payload.name ?? message.body }),
        };
      default: {
        if (payload.post) {
          const post = posts.find((row) => row.id === payload.post);
          if (!post) return { kind: "post", gone: true, text: t("bubble.postGone") };
          const org = Boolean(post.organization);
          const name = shortName(post.organization?.name ?? post.author?.name ?? "");
          return {
            kind: "post",
            gone: false,
            href: `/app/fil/${post.id}`,
            name,
            label: t("bubble.postOf", { name }),
            initials: initialsOf(name),
            image: post.organization?.logo ?? post.author?.image ?? null,
            tone: toneOf(name, org),
            org,
            title: post.title,
            body: post.body,
            photo: post.imageUrl ? { src: post.imageUrl, alt: post.imageAlt ?? "" } : null,
          };
        }
        if (payload.link && /^https?:\/\//i.test(payload.link)) {
          const inside = insideHref(payload.link);
          return {
            kind: "link",
            title: message.body === payload.link ? displayOf(payload.link) : message.body,
            url: inside ?? payload.link,
            display: displayOf(payload.link),
            internal: inside !== null,
          };
        }
        return { kind: "text", text: message.body };
      }
    }
  };

  const readBy = conversation.readBy;
  const dayKey = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - DAY));
  /** « Aujourd’hui », « Hier », « Vendredi 16 octobre ». */
  const dayOf = (date: Date) => {
    const key = dayKey(date);
    if (key === today) return tch("day.today");
    if (key === yesterday) return tch("day.yesterday");
    const text = format.dateTime(date, { weekday: "long", day: "numeric", month: "long" });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  return conversation.messages.map((message) => {
    const bubble = bubbleOf(message);
    const searchText =
      bubble.kind === "text" || bubble.kind === "system"
        ? bubble.text
        : bubble.kind === "decision"
          ? `${bubble.title} ${bubble.paragraphs.join(" ")}`
          : bubble.kind === "doc" || bubble.kind === "contact" || bubble.kind === "org"
            ? `${bubble.name} ${"line" in bubble ? bubble.line : ""}`
            : bubble.kind === "link"
              ? `${bubble.title} ${bubble.display}`
              : bubble.kind === "post"
                ? bubble.gone
                  ? bubble.text
                  : `${bubble.name} ${bubble.title ?? ""} ${bubble.body}`
                : bubble.kind === "event"
                  ? `${bubble.label} ${bubble.title} ${bubble.meta}`
                  : bubble.kind === "interview"
                    ? `${bubble.title} ${bubble.meta}`
                    : "";
    return {
      id: message.id,
      mine: message.senderId === userId,
      at: message.createdAt.toISOString(),
      time: words.when(message.createdAt),
      ephemeral: message.expiresAt !== null,
      read: Boolean(readBy && message.senderId === userId && readBy >= message.createdAt),
      words: searchText,
      day: dayOf(message.createdAt),
      reactions: reactions.get(message.id) ?? null,
      reactable:
        !message.hiddenAt &&
        bubble.kind !== "system" &&
        bubble.kind !== "decision" &&
        message.kind !== "document_request",
      bubble,
    };
  });
}

/** The three next working days for « Proposer un rendez-vous ». */
export function nextDays(words: MessageWords, now = new Date()) {
  const days: { value: string; label: string }[] = [];
  const cursor = new Date(now);
  while (days.length < 3) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    if (day === 0 || day === 6) continue;
    const label = words.format.dateTime(cursor, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    days.push({
      value: cursor.toISOString().slice(0, 10),
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }
  return days;
}

/**
 * What « Joindre » offers in a conversation (planche Chat-joindre): the CVs, the documents and
 * letters kept on Jumanly, and the attestations of the courses finished.
 */
export async function attachments(db: PrismaClient, words: MessageWords, userId: string) {
  const [cvs, letters, documents, certificates, tch] = await Promise.all([
    attachableDocuments(db, userId, "cv"),
    attachableDocuments(db, userId, "lettre"),
    attachableDocuments(db, userId, "document"),
    db.certificate.findMany({
      where: { enrollment: { userId }, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      take: 20,
      select: { id: true, courseTitle: true, hours: true, issuedAt: true },
    }),
    getTranslations("phoneChat.attach"),
  ]);
  const doc = (row: { id: string; title: string; updatedAt: Date }): AttachDoc => ({
    id: row.id,
    title: row.title,
    line: words.t("attach.changed", { date: words.dayMonth(row.updatedAt) }),
  });
  return {
    cvs: cvs.map(doc),
    documents: [
      ...documents.filter((row) => row.kind === "bio" || row.kind === "other"),
      ...letters,
    ].map(doc),
    certificates: certificates.map((row) => ({
      id: row.id,
      title: row.courseTitle,
      line: tch("certificateLine", { hours: row.hours, date: words.dayMonth(row.issuedAt) }),
    })),
  };
}

export type { ThreadView };
