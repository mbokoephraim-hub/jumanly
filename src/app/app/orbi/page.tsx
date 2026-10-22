import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { orbiAides } from "@/lib/orbi";
import { OrbiChat } from "@/components/talent/orbi-chat";
import { AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getOrbiConversation, listOrbiConversations } from "@/server/services/orbi";
import { OrbiHistoryAside } from "@/components/talent/orbi-history";
import { RecruiterOrbi } from "@/components/recruiter/orbi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentOrbi");
  return { title: t("metaTitle"), robots: { index: false } };
}

/** The four aids (planche Fondations § 11): each opens the existing feature. */
const aides = orbiAides;

/**
 * Orbi as a conversation page, the middle tab (talent lot 4 § 9): back arrow, the credits left
 * under Orbi's name, the four aids in colour, the exchange and the composer in place of the
 * bottom bar. `?c=` reopens an exchange of the history. On a computer the latest exchanges stay
 * on the left (planche web talent-4 § 9).
 */
export default async function OrbiPage({ searchParams }: PageProps<"/app/orbi">) {
  const params = await searchParams;
  const user = await requireUser("/app/orbi");
  // Modèle B (B9): Orbi is the floating disc of each tab on a phone; its sheet opens on the Fil.
  // An exchange of the history (`?c=`) keeps this page.
  if (typeof params.c !== "string") await phoneTalentRedirect(user.id, "/app?orbi=1");
  // In an organization's space: the recruiting assistant (recruteur lot 5, planche `ORB_R`).
  const space = await getActiveSpace(user.id);
  if (space)
    return (
      <RecruiterOrbi
        ctx={{ userId: user.id, organizationId: space.organizationId, role: space.role }}
        conversationId={typeof params.c === "string" ? params.c.slice(0, 40) : null}
        question={
          typeof params.q === "string" ? params.q.trim().slice(0, 500) || undefined : undefined
        }
      />
    );
  const t = await getTranslations("talentOrbi");
  const messages = await getMessages();
  // The conversation's texts only: neither the history page nor the rules answers.
  const chatTexts = Object.fromEntries(
    Object.entries(messages.talentOrbi).filter(
      ([key]) => !["historyPage", "rules", "web"].includes(key),
    ),
  );
  const id = typeof params.c === "string" ? params.c.slice(0, 40) : null;
  const [credits, conversation, history] = await Promise.all([
    usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY),
    id ? getOrbiConversation(db, user.id, id) : null,
    listOrbiConversations(db, user.id),
  ]);
  const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      {/* On a computer: the history on the left, the conversation in the middle (web § 9). */}
      <div className="t-orw t-large">
        <OrbiHistoryAside rows={history.slice(0, 8)} current={conversation?.id ?? null} />
        <div className="t-orw-c">
          <NextIntlClientProvider
            messages={{ talentOrbi: chatTexts } as unknown as typeof messages}
          >
            <OrbiChat
              key={conversation?.id ?? "nouveau"}
              conversationId={conversation?.id ?? null}
              messages={conversation?.messages ?? []}
              credits={left}
            >
              <nav aria-label={t("aides.label")}>
                <ul className="t-aides">
                  {aides.map((aide, index) => (
                    <li key={aide.key} className="contents">
                      <Link href={aide.href} className={`t-ai t-p${index + 1}`}>
                        <span className="t-cases">
                          <TalentIcon name={aide.icon} size="s" />
                        </span>
                        <b>{t(`aides.${aide.key}`)}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </OrbiChat>
          </NextIntlClientProvider>
        </div>
      </div>
    </>
  );
}
