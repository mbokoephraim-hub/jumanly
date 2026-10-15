import { getTranslations } from "next-intl/server";
import { Initials, ReasonField, Tag, adminCard, type TagTone } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Button, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import { restoreVersionAction } from "@/server/actions/contents";
import type { Banner, ContentVersion } from "@/server/services/contents";
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
  "content.tip.save": "tipSave",
  "content.restore": "restore",
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

/**
 * « Versions précédentes » (Admin v2, étape 8): each former version of one item, with what it
 * said, who replaced it and why, and « Restaurer » (with a reason).
 */
export async function ContentVersionsCard({
  item,
  versions,
  preview,
}: {
  item: string;
  versions: ContentVersion[];
  /** What a version said, in one line (null: the original text of textes/ applied). */
  preview: (version: ContentVersion) => string | null;
}) {
  const t = await getTranslations("admin.content");
  return (
    <section
      id="versions"
      aria-labelledby="admin-content-versions-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-2 lg:p-5")}
    >
      <h2
        id="admin-content-versions-title"
        className="text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
      >
        {t("versions.title")}
      </h2>
      <p className="text-[11.5px] leading-4 text-ardoise">{t("versions.text")}</p>
      {versions.length === 0 ? (
        <p className="py-1 text-[12.5px] text-ardoise">{t("versions.empty")}</p>
      ) : (
        <ol className="flex flex-col">
          {versions.map((version) => {
            const said = preview(version);
            return (
              <li key={version.id} className="border-brume py-2.5 not-first:border-t">
                <details className="group/version">
                  <summary className="flex cursor-pointer list-none flex-col gap-0.5 [&::-webkit-details-marker]:hidden">
                    <span className="line-clamp-2 text-[12.5px] leading-4 font-semibold">
                      {said ?? t("versions.original")}
                    </span>
                    <span className="text-[11px] leading-[15px] text-ardoise">
                      {t("versions.item", {
                        date: formatShortDate(version.createdAt),
                        name: version.actorName ?? t("changes.unknownActor"),
                      })}
                    </span>
                    {version.reason && (
                      <span className="text-[11px] leading-[15px] text-ardoise">
                        {t("versions.reason", { reason: version.reason })}
                      </span>
                    )}
                    <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold underline underline-offset-4">
                      <Icon name="precedent" className="size-3.5" />
                      {t("versions.restore")}
                    </span>
                  </summary>
                  <form action={restoreVersionAction} className="mt-2.5 flex flex-col gap-2.5">
                    <input type="hidden" name="item" value={item} />
                    <input type="hidden" name="version" value={version.id} />
                    <ReasonField
                      id={`content-version-${version.id}-reason`}
                      rows={2}
                      maxLength={500}
                    />
                    <Button type="submit" size="sm" variant="secondary" className="self-start">
                      {t("versions.restore")}
                    </Button>
                  </form>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
