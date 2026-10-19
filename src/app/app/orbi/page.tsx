import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiChat } from "@/components/talent/orbi-chat";
import { AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getOrbiConversation } from "@/server/services/orbi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentOrbi");
  return { title: t("metaTitle"), robots: { index: false } };
}

/** The four aids (planche Fondations § 11): each opens the existing feature. */
const aides: { key: "cv" | "interview" | "offer" | "path"; href: string; icon: TalentIconName }[] =
  [
    { key: "cv", href: "/app/career/cv", icon: "cv" },
    { key: "interview", href: "/app/career/entretiens", icon: "entretien" },
    { key: "offer", href: "/app/jobs", icon: "opportunites" },
    { key: "path", href: "/app/career/diagnostic", icon: "cap" },
  ];

/**
 * Orbi as a conversation page, the middle tab (talent lot 4 § 9): back arrow, the credits left
 * under Orbi's name, the four aids in colour, the exchange and the composer in place of the
 * bottom bar. `?c=` reopens an exchange of the history.
 */
export default async function OrbiPage({ searchParams }: PageProps<"/app/orbi">) {
  const params = await searchParams;
  const user = await requireUser("/app/orbi");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  const t = await getTranslations("talentOrbi");
  const messages = await getMessages();
  // The conversation's texts only: neither the history page nor the rules answers.
  const chatTexts = Object.fromEntries(
    Object.entries(messages.talentOrbi).filter(([key]) => key !== "historyPage" && key !== "rules"),
  );
  const id = typeof params.c === "string" ? params.c.slice(0, 40) : null;
  const [credits, conversation] = await Promise.all([
    usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY),
    id ? getOrbiConversation(db, user.id, id) : null,
  ]);
  const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <NextIntlClientProvider messages={{ talentOrbi: chatTexts } as unknown as typeof messages}>
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
    </>
  );
}
