import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { OrbiChat } from "@/components/talent/orbi-chat";
import { TalentIcon } from "@/components/talent/icon";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import { getOrbiConversation, listOrbiConversations } from "@/server/services/orbi";
import { OrbiHistoryAside } from "@/components/talent/orbi-history";
import type { TalentIconName } from "@/components/talent/icon";
import {
  organizationCreditsLeft,
  recruiterOrbiActions,
  recruiterOrbiAides,
} from "@/server/services/recruiter-orbi";

type Texts = Record<string, unknown>;

/** Deep merge of two text trees: the recruiter's texts over the talent's conversation texts. */
function merge(base: Texts, over: Texts): Texts {
  const out: Texts = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && current && typeof current === "object"
        ? merge(current as Texts, value as Texts)
        : value;
  }
  return out;
}

/** Icon and colour of a line of the history, by the recruiter's subjects (planche § 1). */
const historyLooks: Record<string, { icon: TalentIconName; tone: string }> = {
  offer: { icon: "offre", tone: "t-c3" },
  candidates: { icon: "candidats", tone: "t-c1" },
  interview: { icon: "entretien", tone: "t-c2" },
  message: { icon: "message", tone: "t-c2" },
  report: { icon: "progression", tone: "t-c1" },
};

/**
 * The texts of the conversation in the recruiter space: the talent's (`talentOrbi`), with the
 * recruiter's own words (`rhOrbi.chat`). Shared by the page and the panel of the web frame.
 */
export function recruiterChatTexts(messages: Awaited<ReturnType<typeof getMessages>>): Texts {
  const base = Object.fromEntries(
    Object.entries(messages.talentOrbi).filter(
      ([key]) => !["historyPage", "rules", "web"].includes(key),
    ),
  );
  return merge(base, messages.rhOrbi.chat as Texts);
}

/**
 * Orbi in the recruiter space (planche recruteur-3 `ORB_R`, v2.4): a conversation page, the back
 * arrow at the top (to the screen it was opened from, À traiter by default), Orbi and the
 * organization's credits, the history, the four aids in colour, the exchange, and the composer
 * where the bottom bar would be. Orbi proposes, the recruiter decides: it rejects nobody.
 */
export async function RecruiterOrbi({
  ctx,
  conversationId,
  question,
}: {
  ctx: HireContext;
  conversationId: string | null;
  /** « Demander à Orbi » from `Ctrl K` on a computer (`?q=`): sent at once, as if typed. */
  question?: string;
}) {
  const t = await getTranslations("rhOrbi");
  const messages = await getMessages();
  const [credits, history, conversation] = await Promise.all([
    organizationCreditsLeft(db, ctx.organizationId),
    listOrbiConversations(db, ctx.userId, "", ctx.organizationId),
    conversationId
      ? getOrbiConversation(db, ctx.userId, conversationId, {
          organizationId: ctx.organizationId,
          actions: recruiterOrbiActions,
        })
      : null,
  ]);
  const chatTexts = recruiterChatTexts(messages);

  return (
    <div className="t-flux t-r5-orbi">
      <h1 className="sr-only">{t("title")}</h1>
      {/* On a computer: the history on the left, the conversation beside it (planche web
          recruteur-3 § 1). Below 1200 px the clock of the head opens the history page. */}
      <div className="t-orw t-large">
        <OrbiHistoryAside
          rows={history.slice(0, 8)}
          current={conversation?.id ?? null}
          looks={historyLooks}
        />
        <div className="t-orw-c">
          <NextIntlClientProvider
            messages={{ talentOrbi: chatTexts } as unknown as typeof messages}
          >
            <OrbiChat
              key={conversation?.id ?? "nouveau"}
              conversationId={conversation?.id ?? null}
              messages={conversation?.messages ?? []}
              credits={credits}
              hrefs={recruiterOrbiActions}
              home="/app/hire"
              question={conversation ? undefined : question}
            >
              <nav aria-label={t("aides.label")}>
                <ul className="t-aides">
                  {recruiterOrbiAides.map((aide, index) => (
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
    </div>
  );
}
