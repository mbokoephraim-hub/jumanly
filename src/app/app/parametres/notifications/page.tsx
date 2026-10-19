import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { SegmentRadios, SwitchRow } from "@/components/talent/settings-controls";
import { cx } from "@/lib/cx";
import { updateNotifications } from "@/server/actions/settings";
import { requireUser } from "@/server/auth/session";
import { NOTIFICATION_CATEGORIES } from "@/server/services/notifications";
import { toHireSettings } from "@/server/settings-redirect";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifReglages");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const icons: Record<(typeof NOTIFICATION_CATEGORIES)[number], [TalentIconName, string?]> = {
  applications: ["candidature", "t-c2"],
  messages: ["message", "t-c2"],
  learning: ["former", "t-c1"],
  billing: ["portefeuille"],
};

/**
 * Notifications (planche talent-4 § 8): one switch per category, the e-mail channel for the
 * reminders, and the newsletter. One form: each switch saves it.
 */
export default async function NotificationSettingsPage({
  searchParams,
}: PageProps<"/app/parametres/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres/notifications");
  if (await inOrganizationSpace(user.id)) toHireSettings("notifications", params);
  const t = await getTranslations();
  const muted = new Set(user.notificationsMuted);

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/parametres"
        backLabel={t("notifReglages.back")}
        title={t("notifReglages.title")}
        end={
          <Link href="/app/parametres" className="t-bi t-press" aria-label={t("parametres.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {one(params.ok) && <Notice tone="ok">{t("parametres.saved")}</Notice>}
      {one(params.erreur) && <Notice tone="err">{t("parametres.error")}</Notice>}

      <form action={updateNotifications} className="t-flux">
        <ul aria-label={t("notifReglages.list")} className="t-verre t-liste t-lignes">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const [icon, tone] = icons[category];
            return (
              <li key={category}>
                <SwitchRow
                  name="category"
                  value={category}
                  defaultChecked={!muted.has(category)}
                  icon={
                    <span className={cx("t-cases", tone)} aria-hidden>
                      <TalentIcon name={icon} size="s" />
                    </span>
                  }
                  title={t(`notifReglages.${category}.title`)}
                  text={t(`notifReglages.${category}.text`)}
                />
              </li>
            );
          })}
          <li>
            <SwitchRow
              name="newsletter"
              defaultChecked={user.newsletter}
              icon={
                <span className="t-cases t-c3" aria-hidden>
                  <TalentIcon name="notification" size="s" />
                </span>
              }
              title={t("notifReglages.newsletter.title")}
              text={t("notifReglages.newsletter.text")}
            />
          </li>
        </ul>

        <span className="t-ck-t" id="notif-canal">
          {t("notifReglages.channel.title")}
        </span>
        <SegmentRadios
          name="emails"
          labelledBy="notif-canal"
          current={user.notificationEmails ? "1" : "0"}
          options={[
            { value: "1", label: t("notifReglages.channel.both") },
            { value: "0", label: t("notifReglages.channel.app") },
          ]}
        />
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("notifReglages.channel.note")}</span>
        </p>
        <noscript>
          <button type="submit" className="t-bt t-sec t-pl">
            {t("parametres.save")}
          </button>
        </noscript>
      </form>
    </div>
  );
}
