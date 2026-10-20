import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { AppearanceChoices } from "@/components/talent/settings-controls";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import type { CurrentUser } from "@/server/auth/session";
import type { ActiveSpace } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";

const cases = (icon: TalentIconName, tone?: "t-c1" | "t-c2" | "t-c3") => (
  <span className={cx("t-cases", tone)} aria-hidden>
    <TalentIcon name={icon} size="s" />
  </span>
);

function Row({
  href,
  icon,
  title,
  text,
  download,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text: string;
  download?: boolean;
}) {
  const body = (
    <>
      {icon}
      <span className="t-t">
        <b>{title}</b>
        <span>{text}</span>
      </span>
      <TalentIcon name="suivant" />
    </>
  );
  return (
    <li>
      {download ? (
        <a href={href} download className="t-li t-press">
          {body}
        </a>
      ) : (
        <Link href={href} className="t-li t-press">
          {body}
        </Link>
      )}
    </li>
  );
}

/**
 * Paramètres of a recruiting team (planche recruteur-3 `PARAM_R`, v2): notifications, appearance,
 * what Orbi does (only on request), then security and privacy with the journal of the profiles
 * opened. The detailed pages are the talent ones (security, privacy, notifications): one account.
 */
export async function RecruiterSettings({
  user,
  space,
  params,
}: {
  user: CurrentUser;
  space: ActiveSpace;
  params: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations();
  const team = hirePermissions(space.role).administer;
  const appearance = t(`parametres.appearance.${user.appearance}`);

  return (
    <div className="t-flux">
      <FlowHead back="/app/hire" backLabel={t("rhSettings.back")} title={t("rhSettings.title")} />
      {typeof params.ok === "string" && <Notice tone="ok">{t("rhSettings.saved")}</Notice>}
      {typeof params.erreur === "string" && <Notice tone="err">{t("rhSettings.error")}</Notice>}

      <h2 className="t-ck-t" id="notifications">
        {t("rhSettings.notifications.group")}
      </h2>
      <ul aria-label={t("rhSettings.notifications.group")} className="t-verre t-liste t-lignes">
        <Row
          href="/app/parametres/notifications"
          icon={cases("notification", "t-c3")}
          title={t("rhSettings.notifications.title")}
          text={t("rhSettings.notifications.text")}
        />
        {/* Lot 6: presence, read receipts and end-of-offer reminders. */}
        <Row
          href="/app/parametres/messagerie"
          icon={cases("message", "t-c2")}
          title={t("messagingSettings.title")}
          text={t("messagingSettings.rowText")}
        />
      </ul>

      <h2 className="t-ck-t">{t("rhSettings.appearance.group")}</h2>
      <ul aria-label={t("rhSettings.appearance.group")} className="t-verre t-liste t-lignes">
        <li>
          <SheetButton target="r5-apparence" className="t-li t-press">
            {cases("orbi")}
            <span className="t-t">
              <b>{t("parametres.appearance.title")}</b>
              <span>{t(`parametres.appearance.${user.appearance}Text`)}</span>
            </span>
            <span className="t-v">{appearance}</span>
          </SheetButton>
        </li>
      </ul>

      <h2 className="t-ck-t">{t("rhSettings.orbi.group")}</h2>
      <ul aria-label={t("rhSettings.orbi.group")} className="t-verre t-liste t-lignes">
        <li className="t-li">
          {cases("document", "t-c2")}
          <span className="t-t">
            <b>{t("rhSettings.orbi.analysis")}</b>
            <span>{t("rhSettings.orbi.analysisText")}</span>
          </span>
        </li>
        <Row
          href="/app/notifications"
          icon={cases("orbi", "t-c3")}
          title={t("rhSettings.orbi.brief")}
          text={t("rhSettings.orbi.briefText")}
        />
      </ul>

      <h2 className="t-ck-t">{t("rhSettings.security.group")}</h2>
      <ul aria-label={t("rhSettings.security.group")} className="t-verre t-liste t-lignes">
        <Row
          href="/app/parametres/securite"
          icon={cases("cadenas", "t-c2")}
          title={t("rhSettings.security.twoFactor")}
          text={
            user.twoFactorEnabled
              ? t("rhSettings.security.twoFactorOn")
              : t("rhSettings.security.twoFactorOff")
          }
        />
        <Row
          href="/app/parametres/consultations"
          icon={cases("confidentialite", "t-c1")}
          title={t("rhSettings.security.journal")}
          text={team ? t("rhSettings.security.journalTeam") : t("rhSettings.security.journalOwn")}
        />
        <Row
          href="/app/parametres/confidentialite"
          icon={cases("confidentialite")}
          title={t("rhSettings.security.privacy")}
          text={t("rhSettings.security.privacyText")}
        />
      </ul>

      <h2 className="t-ck-t">{t("rhSettings.data.group")}</h2>
      <ul aria-label={t("rhSettings.data.group")} className="t-verre t-liste t-lignes">
        <Row
          href="/app/parametres/export"
          download
          icon={cases("telecharger")}
          title={t("rhSettings.data.export")}
          text={t("rhSettings.data.exportText")}
        />
      </ul>

      <Sheet
        id="r5-apparence"
        title={t("parametres.appearance.title")}
        closeLabel={t("rhSettings.close")}
      >
        <AppearanceChoices
          current={user.appearance}
          labels={{
            group: t("parametres.appearance.title"),
            saved: t("parametres.appearance.saved"),
            auto: {
              title: t("parametres.appearance.auto"),
              text: t("parametres.appearance.autoText"),
            },
            light: {
              title: t("parametres.appearance.light"),
              text: t("parametres.appearance.lightText"),
            },
            dark: {
              title: t("parametres.appearance.dark"),
              text: t("parametres.appearance.darkText"),
            },
          }}
        />
      </Sheet>
    </div>
  );
}
