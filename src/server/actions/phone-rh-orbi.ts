"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { initialsOf, toneOf } from "@/components/phone/fil/data";
import { RH_ORBI_FACTS } from "@/components/phone/orbi-bus";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { rhApplications } from "@/server/services/hire-phone-candidatures";
import { rhMessages } from "@/server/services/hire-phone-messages";
import { rhDiscover } from "@/server/services/hire-phone-talents";
import type { OrbiFactAnswer } from "./feed";

const facts = z.enum(RH_ORBI_FACTS);
const SHOWN = 3;
const list = new Intl.ListFormat("fr", { style: "long", type: "conjunction" });

/**
 * Orbi's answers to the recruiter that come from the organization's own facts (Modèle B
 * recruteur M7): what to do today, whom to receive first, which talents to propose, who awaits an
 * answer, the unread conversations. Computed the same way for everyone (the score of doc 08), they
 * ask no credit; Orbi proposes, the member decides, nobody is set aside.
 */
export async function rhOrbiFactAction(raw: string): Promise<OrbiFactAnswer | null> {
  const parsed = facts.safeParse(raw);
  if (!parsed.success) return null;
  const { ctx } = await requireHire("/app/hire");
  const t = await getTranslations("phoneRhOrbi");
  const tq = await getTranslations("phoneRh.orbi");
  const now = new Date();
  const person = (key: string, name: string, href: string, sub: string) => ({
    href,
    title: name,
    sub,
    initials: initialsOf(name),
    image: null,
    tone: toneOf(key, false),
    org: false,
  });

  switch (parsed.data) {
    case "waiting":
    case "unread": {
      const rows = (await rhMessages(db, ctx)).filter((row) =>
        parsed.data === "waiting" ? row.waiting && row.tab !== "equipe" : row.unread > 0,
      );
      const key = parsed.data;
      return {
        question: key === "waiting" ? tq("messages.q1") : tq("messages.q2"),
        text:
          rows.length === 0
            ? t(`fact.${key}.none`)
            : t(`fact.${key}.some`, {
                count: rows.length,
                names: list.format(rows.slice(0, SHOWN).map((row) => row.name)),
              }),
        cards: rows
          .slice(0, SHOWN)
          .map((row) =>
            person(row.personId, row.name, row.href, row.preview ?? row.context.job ?? ""),
          ),
        action:
          rows.length > SHOWN ? { href: "/app/messages", label: t("fact.waiting.action") } : null,
      };
    }
    case "first": {
      const data = await rhApplications(db, ctx, null, now);
      const open = data.rows.filter((row) => row.phase !== "nonretenu" && row.phase !== "recrute");
      const first = open.slice(0, SHOWN);
      return {
        question: tq("candidatures.q1"),
        text:
          open.length === 0
            ? t("fact.first.none")
            : data.withScores
              ? t("fact.first.some", { count: first.length })
              : t("fact.first.locked"),
        cards: first.map((row) =>
          person(
            row.id,
            row.name,
            `/app/hire/candidats/${row.id}`,
            row.score !== null
              ? t("fact.firstCard", { score: row.score, job: row.jobTitle })
              : t("fact.firstCardNoScore", { job: row.jobTitle }),
          ),
        ),
        action: { href: "/app/hire/candidats", label: t("fact.first.action") },
      };
    }
    case "propose": {
      const found = hirePermissions(ctx.role).manage
        ? await rhDiscover(db, ctx, null, now)
        : ({ status: "locked" } as const);
      if (found.status === "locked")
        return {
          question: tq("talents.q1"),
          text: t("fact.propose.locked"),
          cards: [],
          action: null,
        };
      const cards = found.cards.filter((card) => !card.proposal).slice(0, SHOWN);
      return {
        question: tq("talents.q1"),
        text:
          cards.length === 0
            ? t("fact.propose.none")
            : t("fact.propose.some", { count: found.total }),
        cards: cards.map((card) =>
          person(
            card.profileId,
            card.name ?? card.headline,
            `/app/hire/talents/${card.profileId}`,
            card.score !== null && card.jobTitle
              ? t("fact.proposeCard", { score: card.score, job: card.jobTitle })
              : card.headline,
          ),
        ),
        action: { href: "/app/hire/talents", label: t("fact.propose.action") },
      };
    }
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86_400_000);
      const [interviews, rows, applications] = await Promise.all([
        db.interview.count({
          where: {
            organizationId: ctx.organizationId,
            startsAt: { gte: start, lt: end },
            status: { in: ["pending", "confirmed"] },
          },
        }),
        rhMessages(db, ctx),
        rhApplications(db, ctx, null, now),
      ]);
      const waiting = rows.filter((row) => row.waiting && row.tab !== "equipe").length;
      const fresh = applications.rows.filter((row) => row.unseen).length;
      const items = [
        interviews > 0 ? t("fact.today.interviews", { count: interviews }) : null,
        fresh > 0 ? t("fact.today.fresh", { count: fresh }) : null,
        waiting > 0 ? t("fact.today.waiting", { count: waiting }) : null,
      ].filter((item): item is string => item !== null);
      return {
        question: t("q1"),
        text:
          items.length === 0
            ? t("fact.today.none")
            : t("fact.today.some", { items: list.format(items) }),
        cards: [],
        action: { href: "/app/hire/candidats", label: t("fact.today.action") },
      };
    }
  }
}
