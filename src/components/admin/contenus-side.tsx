import { getTranslations } from "next-intl/server";
import { Initials, Tag, adminCard, type TagTone } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import type { Banner } from "@/server/services/contents";
import type { contentHistory } from "@/server/services/contents-admin";

/**
 * Side cards of /admin/contenus (mockup 07-10): the history of the changes (from the audit log)
 * and the banners with their state.
 */

const actionKey = {
  "content.faq.save": "faqSave",
  "content.faq.hide": "faqHide",
  "content.faq.reset": "faqReset",
  "content.banner.save": "bannerSave",
  "content.banner.delete": "bannerDelete",
} as const;

/** « Programmée », « En ligne » or « Terminée », from the dates (whole days in UTC). */
export function bannerState(banner: Banner, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  if (banner.start && banner.start > today) return "scheduled" as const;
  if (banner.end && banner.end < today) return "ended" as const;
  return "live" as const;
}
export const bannerStateTone: Record<ReturnType<typeof bannerState>, TagTone> = {
  scheduled: "warning",
  live: "success",
  ended: "neutral",
};
const bannerStateBg = {
  scheduled: "bg-ambre-fond",
  live: "bg-lime-clair",
  ended: "bg-creme",
} as const;

/**
 * The changes of one item (numbered as versions, the last one online) or, without an item, the
 * last changes of all the contents.
 */
export async function ContentHistoryCard({
  history,
  versions,
}: {
  history: Awaited<ReturnType<typeof contentHistory>>;
  versions: boolean;
}) {
  const t = await getTranslations("admin.content");
  return (
    <section
      aria-labelledby="admin-content-history-title"
      className={cx(adminCard, "flex flex-col gap-1.5 lg:p-5")}
    >
      <h2
        id="admin-content-history-title"
        className="text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
      >
        {versions ? t("history") : t("changes.title")}
      </h2>
      {history.entries.length === 0 ? (
        <p className="py-2 text-[12.5px] text-ardoise">{t("changes.empty")}</p>
      ) : (
        <ol className="flex flex-col">
          {history.entries.map((entry, index) => {
            const name = entry.actorName ?? t("changes.unknownActor");
            const key = actionKey[entry.action as keyof typeof actionKey];
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2.5 border-brume py-2.5 not-first:border-t"
              >
                <Initials name={name} size={30} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12.5px] leading-4 font-semibold">
                    {versions
                      ? t("changes.version", { number: history.total - index })
                      : key
                        ? t(`changes.action.${key}`)
                        : entry.action}
                  </span>
                  <span className="text-[11px] leading-[15px] text-ardoise">
                    {t("changes.by", { date: formatShortDate(entry.createdAt), name })}
                    {versions && key && ` · ${t(`changes.action.${key}`)}`}
                  </span>
                </span>
                {versions && index === 0 && entry.action === "content.faq.save" && (
                  <Tag tone="lime">{t("changes.current")}</Tag>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export async function BannersSummaryCard({ banners }: { banners: Banner[] }) {
  const t = await getTranslations("admin.content");
  return (
    <section
      aria-labelledby="admin-content-banners-title"
      className={cx(adminCard, "flex flex-col gap-2.5 lg:p-5")}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="admin-content-banners-title"
          className="text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
        >
          {t("tab.banners")}
        </h2>
        <ButtonLink
          href="/admin/contenus?onglet=bannieres#nouvelle-banniere"
          variant="tertiary"
          size="sm"
          icon={<Icon name="plus" />}
        >
          {t("banner.add")}
        </ButtonLink>
      </div>
      {banners.length === 0 ? (
        <p className="text-[12.5px] leading-[18px] text-ardoise">{t("banner.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {banners.map((banner) => {
            const state = bannerState(banner);
            return (
              <li key={banner.id}>
                <a
                  href={`/admin/contenus?onglet=bannieres#banniere-${banner.id}`}
                  className={cx(
                    "flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 hover:ring-[1.5px] hover:ring-sapin/30",
                    bannerStateBg[state],
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[12.5px] leading-4 font-semibold">{banner.text}</span>
                    <span className="text-[11px] leading-[15px] text-ardoise">
                      {t(`banner.audience.${banner.audience}`)} ·{" "}
                      {t(`banner.style.${banner.style}`)}
                    </span>
                  </span>
                  <Tag tone={bannerStateTone[state]}>{t(`banner.status.${state}`)}</Tag>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
