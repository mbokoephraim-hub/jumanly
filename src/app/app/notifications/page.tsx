import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TeamNotifications } from "@/components/connect/team-notifications";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { notificationGroups } from "@/components/talent/notification-rows";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Notifications (planche talent-2 § 5): grouped by day, the new ones lit; a tap opens the page
 * and marks it read. On a tablet or a computer the bell of the top bar opens the same list in a
 * panel (planche web talent-2 § 4); « Toutes les notifications » leads here. A recruiting team or a
 * partner keeps its own screen.
 */
export default async function NotificationsPage({ searchParams }: PageProps<"/app/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/notifications");
  const [space, partner] = await Promise.all([getActiveSpace(user.id), getPartnerSpace(user.id)]);
  if (space || partner) return <TeamNotifications params={params} user={user} />;

  const t = await getTranslations();
  const { groups, unread } = await notificationGroups(user.id);

  return (
    <div className="t-flux t-notifs">
      <FlowHead
        back="/app"
        backLabel={t("notifications.back")}
        title={t("notifications.title")}
        end={
          <Link
            href="/app/parametres?onglet=confidentialite"
            className="t-bi t-press"
            aria-label={t("notifications.preferences")}
          >
            <TalentIcon name="reglages" size="s" />
          </Link>
        }
      />
      {params.ok === "lues" && <Notice tone="ok">{t("notifications.allRead")}</Notice>}
      {groups.length === 0 ? (
        <div className="t-verre t-carte t-vide">
          <b>{t("notifs.empty.title")}</b>
          <span>{t("notifications.empty.text")}</span>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`nt-${group.key}`} className="t-flux t-serre">
            <h2 id={`nt-${group.key}`} className="t-grp-t">
              {group.title}
            </h2>
            <div className="t-verre t-liste t-lignes">
              {group.items.map((item) => (
                <form key={item.id} action={markNotificationsReadAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="href" value={item.href} />
                  <button type="submit" className={cx("t-li t-press", item.unread && "t-nv")}>
                    <span className={cx("t-cases", item.tone)} aria-hidden>
                      <TalentIcon name={item.icon} size="s" />
                    </span>
                    <span className="t-t">
                      <b>{item.title}</b>
                      {item.line && <span>{item.line}</span>}
                      {item.unread && (
                        <span className="sr-only">{t("notifications.item.unread")}</span>
                      )}
                    </span>
                    <span className="t-v">{item.time}</span>
                  </button>
                </form>
              ))}
            </div>
          </section>
        ))
      )}
      {unread && (
        <form action={markNotificationsReadAction}>
          <button type="submit" className="t-bt t-sec t-pl t-press">
            {t("notifications.markAllRead")}
          </button>
        </form>
      )}
    </div>
  );
}
