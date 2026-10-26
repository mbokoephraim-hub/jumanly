import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TeamNotifications } from "@/components/connect/team-notifications";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { notificationGroups } from "@/components/talent/notification-rows";
import { RecruiterBrief } from "@/components/recruiter/brief";
import { EndingOffers } from "@/components/recruiter/ending";
import { JoinRequestsCard } from "@/components/recruiter/org-join";
import { cx } from "@/lib/cx";
import { markNotificationsReadAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { hireToday } from "@/server/services/hire-today";
import { isPhone } from "@/server/view";
import { PhoneNotifications } from "@/components/phone/fil/notifications";
import { FilTexts, notificationRows } from "@/components/phone/fil/server";
import { RhMessagesTexts } from "@/components/phone/recruteur/messages";
import { RhNotificationsScreen } from "@/components/phone/recruteur/notifications";

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
  // A partner keeps its own screen; a recruiting team gets Orbi's brief of the day above the list
  // (planche r3plus `NOTIF_R`, recruteur lot 5).
  if (partner && !space) return <TeamNotifications params={params} user={user} />;
  // On a phone, the talent's notifications of Modèle B (lot B3), from the bell of the Fil.
  // On a phone, the recruiter's notifications of Modèle B (recruteur M7).
  if (space && (await isPhone()))
    return (
      <RhMessagesTexts>
        <RhNotificationsScreen userId={user.id} />
      </RhMessagesTexts>
    );
  if (!space && !partner && (await isPhone()))
    return (
      <FilTexts>
        <PhoneNotifications rows={await notificationRows(user.id)} />
      </FilTexts>
    );

  const t = await getTranslations();
  const ctx = space
    ? { userId: user.id, organizationId: space.organizationId, role: space.role }
    : null;
  const [{ groups, unread }, brief] = await Promise.all([
    notificationGroups(user.id),
    ctx ? hireToday(db, ctx) : null,
  ]);

  return (
    <div className={cx("t-flux t-notifs", ctx && "t-w4 t-large t-rw3-notifs")}>
      <div className={ctx ? "t-w4-h" : "t-rw3-nw"}>
        <FlowHead
          back={ctx ? "/app/hire" : "/app"}
          backLabel={ctx ? t("rhNotifications.back") : t("notifications.back")}
          title={t("notifications.title")}
          end={
            <Link
              href={
                ctx ? "/app/parametres#notifications" : "/app/parametres?onglet=confidentialite"
              }
              className="t-bi t-press"
              aria-label={t("notifications.preferences")}
            >
              <TalentIcon name="reglages" size="s" />
            </Link>
          }
        />
        {ctx && (
          <Link href="/app/parametres/notifications" className="t-bt t-sec t-m t-press t-w4-web">
            <TalentIcon name="reglages" size="s" />
            {t("notifications.preferences")}
          </Link>
        )}
      </div>
      {params.ok === "lues" && <Notice tone="ok">{t("notifications.allRead")}</Notice>}
      {/* Ordinateur et tablette, espace recruteur (planche web recruteur-3 § 2) : le résumé du jour
          et ce qui attend une réponse à gauche, les notifications à droite. */}
      <div className={ctx ? "t-w4-g2 t-rw3-ntg" : "t-rw3-nw"}>
        <div className={ctx ? "t-w4-col" : "t-rw3-nw"}>
          {brief && <RecruiterBrief today={brief} firstName={user.firstName || user.name} />}
          {/* Lot 6: join requests to answer, and the offers closing soon (planches REJ_ADM, FIN). */}
          {ctx && (
            <JoinRequestsCard
              ctx={ctx}
              answer={typeof params.demande === "string" ? params.demande : undefined}
            />
          )}
          {ctx && (
            <EndingOffers
              ctx={ctx}
              answer={typeof params.fin === "string" ? params.fin : undefined}
            />
          )}
        </div>
        <div className={ctx ? "t-w4-col" : "t-rw3-nw"}>
          {groups.length === 0 ? (
            <div className="t-verre t-carte t-vide">
              <b>{t("notifs.empty.title")}</b>
              <span>{t("notifications.empty.text")}</span>
            </div>
          ) : (
            groups.map((group) => (
              <section
                key={group.key}
                aria-labelledby={`nt-${group.key}`}
                className="t-flux t-serre"
              >
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
      </div>
    </div>
  );
}
