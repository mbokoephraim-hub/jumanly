import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TeamNotifications } from "@/components/connect/team-notifications";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import {
  listNotifications,
  notificationTypes,
  notificationValues,
  type NotificationType,
} from "@/server/services/notifications";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title"), robots: { index: false } };
}

/** A short title and a line for what a talent receives (planche talent-2 § 5); the rest keeps its sentence. */
const look: Partial<Record<NotificationType, { icon: TalentIconName; tone: string }>> = {
  interviewInvite: { icon: "entretien", tone: "t-c2" },
  interviewCanceled: { icon: "entretien", tone: "" },
  profileViewed: { icon: "profil", tone: "t-c3" },
  statusChange: { icon: "candidature", tone: "t-c3" },
  notSelected: { icon: "candidature", tone: "" },
  jobUnavailable: { icon: "offre", tone: "" },
  certificateIssued: { icon: "certificat", tone: "t-c1" },
  documentRequest: { icon: "document", tone: "" },
  newMessage: { icon: "message", tone: "t-c2" },
  contactRequest: { icon: "entreprise", tone: "t-c2" },
  diagnosticReady: { icon: "progression", tone: "t-c1" },
};
const accountIcon: Partial<Record<NotificationType, TalentIconName>> = {
  paymentSucceeded: "portefeuille",
  paymentFailed: "portefeuille",
  renewalDue: "portefeuille",
  grace: "portefeuille",
  renewed: "portefeuille",
  upgraded: "portefeuille",
  downgraded: "portefeuille",
  diagnosticReminder: "agenda",
};

const DAY = 86_400_000;

/**
 * Notifications (planche talent-2 § 5): grouped by day, the new ones lit; a tap opens the page
 * and marks it read. A recruiting team or a partner keeps its own screen.
 */
export default async function NotificationsPage({ searchParams }: PageProps<"/app/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/notifications");
  const [space, partner] = await Promise.all([getActiveSpace(user.id), getPartnerSpace(user.id)]);
  if (space || partner) return <TeamNotifications params={params} user={user} />;

  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const notifications = (await listNotifications(db, user.id)).filter((item) =>
    (notificationTypes as readonly string[]).includes(item.type),
  );
  const unread = notifications.some((item) => !item.readAt);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const groupOf = (date: Date) =>
    date >= today ? "today" : date.getTime() >= today.getTime() - 6 * DAY ? "thisWeek" : "earlier";
  const groups = (["today", "thisWeek", "earlier"] as const)
    .map((key) => ({ key, items: notifications.filter((item) => groupOf(item.createdAt) === key) }))
    .filter((group) => group.items.length > 0);
  const timeOf = (date: Date) => {
    const group = groupOf(date);
    if (group === "today") return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    if (group === "thisWeek") return format.dateTime(date, { weekday: "short" });
    return format.dateTime(date, { day: "numeric", month: "short" });
  };

  return (
    <div className="t-flux">
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
              {t(`notifs.group.${group.key}`)}
            </h2>
            <div className="t-verre t-liste t-lignes">
              {group.items.map((notification) => {
                const type = notification.type as NotificationType;
                const values = notificationValues(notification.payload);
                const style = look[type];
                const fresh = !notification.readAt;
                const line = style
                  ? type === "interviewInvite"
                    ? t("notifs.line.interviewInvite", { company: values.company ?? "" })
                    : type === "diagnosticReady"
                      ? t("notifs.line.diagnosticReady", { stage: values.stage ?? "" })
                      : [
                          values.company ?? values.org ?? values.senderName,
                          values.jobTitle ??
                            values.job ??
                            values.courseTitle ??
                            values.documentName,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                  : null;
                return (
                  <form key={notification.id} action={markNotificationsReadAction}>
                    <input type="hidden" name="id" value={notification.id} />
                    <input type="hidden" name="href" value={notification.href ?? ""} />
                    <button type="submit" className={cx("t-li t-press", fresh && "t-nv")}>
                      <span className={cx("t-cases", style?.tone)} aria-hidden>
                        <TalentIcon
                          name={style?.icon ?? accountIcon[type] ?? "notification"}
                          size="s"
                        />
                      </span>
                      <span className="t-t">
                        <b>
                          {style
                            ? d(`notifs.title.${type}`, values)
                            : t(`notifications.item.${type}`, values)}
                        </b>
                        {line && <span>{line}</span>}
                        {fresh && <span className="sr-only">{t("notifications.item.unread")}</span>}
                      </span>
                      <span className="t-v">{timeOf(notification.createdAt)}</span>
                    </button>
                  </form>
                );
              })}
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
