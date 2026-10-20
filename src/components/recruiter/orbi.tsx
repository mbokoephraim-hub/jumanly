import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { OrbiChat } from "@/components/talent/orbi-chat";
import { TalentIcon } from "@/components/talent/icon";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import { getOrbiConversation } from "@/server/services/orbi";
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

/**
 * Orbi in the recruiter space (planche recruteur-3 `ORB_R`, v2.4): a conversation page, the back
 * arrow at the top (to the screen it was opened from, À traiter by default), Orbi and the
 * organization's credits, the history, the four aids in colour, the exchange, and the composer
 * where the bottom bar would be. Orbi proposes, the recruiter decides: it rejects nobody.
 */
export async function RecruiterOrbi({
  ctx,
  conversationId,
}: {
  ctx: HireContext;
  conversationId: string | null;
}) {
  const t = await getTranslations("rhOrbi");
  const messages = await getMessages();
  const [credits, conversation] = await Promise.all([
    organizationCreditsLeft(db, ctx.organizationId),
    conversationId
      ? getOrbiConversation(db, ctx.userId, conversationId, {
          organizationId: ctx.organizationId,
          actions: recruiterOrbiActions,
        })
      : null,
  ]);
  // The conversation's texts are the talent's (`talentOrbi`), with the recruiter's own words.
  const base = Object.fromEntries(
    Object.entries(messages.talentOrbi).filter(
      ([key]) => !["historyPage", "rules", "web"].includes(key),
    ),
  );
  const chatTexts = merge(base, messages.rhOrbi.chat as Texts);

  return (
    <div className="t-flux t-r5-orbi">
      <h1 className="sr-only">{t("title")}</h1>
      <NextIntlClientProvider messages={{ talentOrbi: chatTexts } as unknown as typeof messages}>
        <OrbiChat
          key={conversation?.id ?? "nouveau"}
          conversationId={conversation?.id ?? null}
          messages={conversation?.messages ?? []}
          credits={credits}
          hrefs={recruiterOrbiActions}
          home="/app/hire"
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
  );
}
