import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/brand/icon";
import { card, cardTitle } from "@/components/career/kit";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { getContentOverrides } from "@/server/queries/public";
import { publishedTips } from "@/server/services/contents";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.tips");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Conseils de préparation » (partie 05: free for everyone, static content, no AI). The sheets
 * are written in /admin/contenus (Admin v2, étape 8).
 */
export default async function CareerTipsPage() {
  await requireUser("/app/career/conseils");
  const t = await getTranslations("career.tips");
  const tips = publishedTips(await getMessages(), await getContentOverrides());
  return (
    <>
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("intro")} />
      {tips.length === 0 ? (
        <p className={cx(card, "text-[14px] text-ardoise")}>{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {tips.map((tip) => (
            <article
              key={tip.id}
              id={`conseil-${tip.id}`}
              aria-labelledby={`conseil-${tip.id}-title`}
              className={cx(card, "flex scroll-mt-6 flex-col gap-3")}
            >
              <details className="group/tip">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-col gap-1">
                    <h2 id={`conseil-${tip.id}-title`} className={cardTitle}>
                      {tip.title}
                    </h2>
                    <span className="text-[12.5px] text-ardoise">
                      {t("readTime", { minutes: tip.minutes })}
                    </span>
                  </span>
                  <Icon
                    name="chev-d"
                    className="mt-1 size-5 shrink-0 transition-transform group-open/tip:rotate-180"
                  />
                </summary>
                <div className="mt-3 flex flex-col gap-3 text-[14.5px] leading-[23px]">
                  {tip.body.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
      <ButtonLink
        href="/app/career"
        variant="tertiary"
        icon={<Icon name="chev-l" />}
        className="self-start"
      >
        {t("back")}
      </ButtonLink>
    </>
  );
}
