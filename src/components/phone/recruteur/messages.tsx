import "server-only";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import {
  newMessageChoices,
  RH_MESSAGE_TABS,
  rhMessages,
  type RhMessageRow,
  type RhMessageTab,
} from "@/server/services/hire-phone-messages";
import { initialsOf, tintOf } from "./candidatures";
import { RhMessagesList, RhNewMessage, type RhListRow } from "./messages-client";

/** The client texts of Messages, notifications and Orbi (lot M7). */
export async function RhMessagesTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        "phoneRhMessages",
        "phoneRhNotifs",
        "phoneRhOrbi",
        "phone",
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * The time of a line (planche 120): the hour today, « hier », the day of the week, then the
 * date. Shown in the person's time zone by the formatter.
 */
export async function whenLabel(at: Date, now = new Date()) {
  const format = await getFormatter();
  const t = await getTranslations("phoneRhNotifs.ago");
  const day = (date: Date) =>
    format.dateTime(date, { year: "numeric", month: "numeric", day: "numeric" });
  if (day(at) === day(now)) {
    const parts = format.dateTime(at, { hour: "numeric", minute: "2-digit" }).split(":");
    return parts.length === 2 ? `${parts[0]} h ${parts[1]}` : parts.join(":");
  }
  if (day(at) === day(new Date(now.getTime() - 86_400_000))) return t("yesterday");
  if (now.getTime() - at.getTime() < 6 * 86_400_000)
    return format.dateTime(at, { weekday: "long" });
  return format.dateTime(at, { day: "numeric", month: "short" });
}

/** The green line of a conversation: the offer and its stage, the relation, the colleague. */
export async function contextLine(context: RhMessageRow["context"]) {
  const t = await getTranslations("phoneRhMessages");
  switch (context.kind) {
    case "application":
      return context.stage
        ? t("context.application", { job: context.job ?? "", stage: context.stage })
        : (context.job ?? "");
    case "proposal":
      return context.job ? t("context.proposal", { job: context.job }) : t("context.proposalNoJob");
    case "relation":
      return context.headline
        ? t("context.relation", { headline: context.headline })
        : t("context.relationOnly");
    case "team": {
      const role = context.role ? t(`role.${context.role}`) : "";
      return [context.headline, role].filter(Boolean).join(" · ");
    }
  }
}

/**
 * The tab Messages of the recruiter's phone (planches 120 to 124): the search field, three
 * lists (Candidats, Réseau, Équipe) with what is unread, and « + » for a new message.
 */
export async function RhMessages({ ctx, tab }: { ctx: HireContext; tab: string | undefined }) {
  const now = new Date();
  const [rows, organization] = await Promise.all([
    rhMessages(db, ctx),
    db.organization.findUnique({ where: { id: ctx.organizationId }, select: { name: true } }),
  ]);
  const list: RhListRow[] = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      href: row.href,
      tab: row.tab,
      name: row.name,
      initials: initialsOf(row.name) || "?",
      tint: tintOf(row.personId),
      context: await contextLine(row.context),
      preview: row.preview,
      mine: row.mine,
      unread: row.unread,
      when: await whenLabel(row.at, now),
    })),
  );
  const chosen: RhMessageTab = RH_MESSAGE_TABS.find((key) => key === tab) ?? "candidats";
  return <RhMessagesList rows={list} tab={chosen} org={organization?.name ?? ""} />;
}

/** « + » of the head (planche 124): a candidate already in conversation, or a colleague. */
export async function RhNewMessageButton({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhMessages");
  const choices = await newMessageChoices(db, ctx);
  return (
    <RhNewMessage
      candidates={choices.candidates.map((row) => ({
        key: row.id,
        href: `/app/messages/${row.id}`,
        name: row.name,
        line: t("compose.candidate", { job: row.job ?? "" }),
      }))}
      members={choices.members.map((member) => ({
        key: member.id,
        name: member.name,
        line: t("compose.team", { role: t(`role.${member.role}`) }),
      }))}
    />
  );
}
