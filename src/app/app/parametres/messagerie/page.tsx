import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { SwitchRow } from "@/components/talent/settings-controls";
import { cx } from "@/lib/cx";
import { updateMessagingSettings } from "@/server/actions/messaging-settings";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { endingReminderDays } from "@/server/services/job-reminders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messagingSettings");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * Messagerie et rappels (brief recruteur § 2.16 bis et § 2.19): « En ligne » and « Lu », each
 * person's choice and reciprocal; for a recruiter, when the end-of-offer reminders arrive (J-7,
 * J-3, J-1, the last day). One form: each switch saves it.
 */
export default async function MessagingSettingsPage({
  searchParams,
}: PageProps<"/app/parametres/messagerie">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres/messagerie");
  const t = await getTranslations("messagingSettings");
  const [prefs, space] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { showPresence: true, readReceipts: true, endingReminders: true },
    }),
    getActiveSpace(user.id),
  ]);
  const days = new Set(prefs?.endingReminders ?? []);

  return (
    <div className="t-flux">
      <FlowHead back="/app/parametres" backLabel={t("back")} title={t("title")} />
      {one(params.ok) && <Notice tone="ok">{t("saved")}</Notice>}
      <form action={updateMessagingSettings} className="t-flux">
        <h2 className="t-ck-t">{t("messages.group")}</h2>
        <ul aria-label={t("messages.group")} className="t-verre t-liste t-lignes">
          <li>
            <SwitchRow
              name="presence"
              defaultChecked={prefs?.showPresence ?? true}
              icon={
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="profil" size="s" />
                </span>
              }
              title={t("messages.presence")}
              text={t("messages.presenceText")}
            />
          </li>
          <li>
            <SwitchRow
              name="receipts"
              defaultChecked={prefs?.readReceipts ?? true}
              icon={
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="valider" size="s" />
                </span>
              }
              title={t("messages.receipts")}
              text={t("messages.receiptsText")}
            />
          </li>
        </ul>
        {space && (
          <>
            <h2 className="t-ck-t">{t("reminders.group")}</h2>
            <ul aria-label={t("reminders.group")} className="t-verre t-liste t-lignes">
              {endingReminderDays.map((day) => (
                <li key={day}>
                  <SwitchRow
                    name="reminder"
                    value={day}
                    defaultChecked={days.has(day)}
                    icon={
                      <span className={cx("t-cases", day === "d3" && "t-c3")} aria-hidden>
                        <TalentIcon name="agenda" size="s" />
                      </span>
                    }
                    title={t(`reminders.${day}`)}
                    text={day === "d3" ? t("reminders.default") : undefined}
                  />
                </li>
              ))}
            </ul>
            <p className="t-gar">
              <TalentIcon name="notification" size="s" />
              <span>{t("reminders.note")}</span>
            </p>
          </>
        )}
        <input type="hidden" name="space" value={space ? "1" : "0"} />
        <noscript>
          <button type="submit" className="t-bt t-sec t-pl">
            {t("save")}
          </button>
        </noscript>
      </form>
    </div>
  );
}
