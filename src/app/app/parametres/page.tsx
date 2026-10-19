import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HireSettings } from "@/components/account/hire-settings";
import { FlowHead } from "@/components/talent/flow-head";
import { SettingsNav } from "@/components/talent/settings-nav";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import {
  AppearanceChoices,
  DataSaverRow,
  DeleteAccountFields,
  SwitchRow,
} from "@/components/talent/settings-controls";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { DELETION_GRACE_DAYS } from "@/lib/password";
import { scheduleDeletion, updateDisplay } from "@/server/actions/settings";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ownedOrganization } from "@/server/services/accounts";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parametres");
  return { title: t("seo"), robots: { index: false } };
}

type Tone = "t-c1" | "t-c2" | "t-c3";
const cases = (icon: TalentIconName, tone?: Tone) => (
  <span className={cx("t-cases", tone)} aria-hidden>
    <TalentIcon name={icon} size="s" />
  </span>
);

function Row({
  href,
  icon,
  title,
  text,
  end,
  download,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text?: string;
  end?: ReactNode;
  download?: boolean;
}) {
  const body = (
    <>
      {icon}
      <span className="t-t">
        <b>{title}</b>
        {text && <span>{text}</span>}
      </span>
      {end ?? <TalentIcon name="suivant" />}
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

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * Paramètres (planche talent-4 § 8): security, privacy and notifications in their own pages, the
 * settings of this phone (data saving, appearance, motion), the language, then the data: download
 * them, or delete the account in a sheet. An organization's member keeps the former page.
 */
export default async function SettingsPage({ searchParams }: PageProps<"/app/parametres">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres");
  if (await inOrganizationSpace(user.id)) return <HireSettings params={params} />;
  const t = await getTranslations();
  const [org, credential] = await Promise.all([
    ownedOrganization(db, user.id),
    db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { password: true },
    }),
  ]);
  const deleting = one(params.supprimer) === "1";
  const error = one(params.erreur);
  const appearance = t(`parametres.appearance.${user.appearance}`);

  return (
    <div className="t-flux t-w4 t-large">
      <FlowHead back="/app/compte" backLabel={t("parametres.back")} title={t("parametres.title")} />
      <div className="t-w4-prm">
        <SettingsNav on="affichage" />
        <div className="t-w4-col">
          {one(params.ok) && <Notice tone="ok">{t("parametres.saved")}</Notice>}
          {error && !deleting && <Notice tone="err">{t("parametres.error")}</Notice>}

          <ul
            aria-label={t("parametres.group.sections")}
            className="t-verre t-liste t-lignes t-w4-tel"
          >
            <Row
              href="/app/parametres/securite"
              icon={cases("cadenas", "t-c2")}
              title={t("parametres.security.title")}
              text={t("parametres.security.text")}
            />
            <Row
              href="/app/parametres/confidentialite"
              icon={cases("confidentialite", "t-c1")}
              title={t("parametres.privacy.title")}
              text={t("parametres.privacy.text")}
            />
            <Row
              href="/app/parametres/notifications"
              icon={cases("notification", "t-c3")}
              title={t("parametres.notifications.title")}
              text={t("parametres.notifications.text")}
            />
          </ul>

          <h2 className="t-w4-web t-w4-h3">{t("parametres.group.device")}</h2>
          <ul aria-label={t("parametres.group.device")} className="t-verre t-liste t-lignes">
            <li>
              <DataSaverRow
                icon={cases("progression")}
                title={t("parametres.dataSaver.title")}
                text={t("parametres.dataSaver.text")}
              />
            </li>
            <li>
              <SheetButton target="parametres-apparence" className="t-li t-press">
                {cases("orbi")}
                <span className="t-t">
                  <b>{t("parametres.appearance.title")}</b>
                  <span>{t(`parametres.appearance.${user.appearance}Text`)}</span>
                </span>
                <span className="t-v">{appearance}</span>
              </SheetButton>
            </li>
            <li>
              <form action={updateDisplay}>
                <SwitchRow
                  name="reduceMotion"
                  defaultChecked={user.reduceMotion}
                  icon={cases("horloge")}
                  title={t("parametres.motion.title")}
                  text={t("parametres.motion.text")}
                />
                <noscript>
                  <button type="submit" className="t-bt t-txt t-s">
                    {t("parametres.save")}
                  </button>
                </noscript>
              </form>
            </li>
            <li className="t-li">
              {cases("document")}
              <span className="t-t">
                <b>{t("parametres.language.title")}</b>
                <span>{t("parametres.language.value")}</span>
              </span>
            </li>
            <Row
              href="/app/parametres?arrivee=1&revoir=1"
              icon={cases("aujourdhui")}
              title={t("parametres.intro.title")}
              text={t("parametres.intro.text")}
            />
          </ul>

          <h2 className="t-w4-web t-w4-h3">{t("parametres.group.data")}</h2>
          <ul aria-label={t("parametres.group.data")} className="t-verre t-liste t-lignes">
            <Row
              href="/app/parametres/export"
              download
              icon={cases("telecharger")}
              title={t("parametres.export.title")}
              text={t("parametres.export.text")}
            />
            <li>
              <SheetButton target="parametres-supprimer" className="t-li t-danger t-press">
                {cases("supprimer")}
                <span className="t-t">
                  <b>{t("parametres.delete.title")}</b>
                </span>
              </SheetButton>
            </li>
          </ul>
        </div>
      </div>

      <Sheet
        id="parametres-apparence"
        title={t("parametres.appearance.title")}
        closeLabel={t("parametres.close")}
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

      <Sheet
        id="parametres-supprimer"
        title={t("parametres.delete.sheet")}
        closeLabel={t("parametres.close")}
        openParam="supprimer"
        defaultOpen={deleting}
      >
        {org ? (
          <p className="t-gar t-err">
            <TalentIcon name="aide" size="s" />
            <span>{t("parametres.delete.owner", { org: org.name })}</span>
          </p>
        ) : (
          <form action={scheduleDeletion} className="t-flux t-suppr">
            <div className="t-danger-c">
              <b>{t("parametres.delete.what")}</b>
              <p>{t("parametres.delete.text", { days: DELETION_GRACE_DAYS })}</p>
            </div>
            {deleting && error === "confirm" && (
              <Notice tone="err">{t("parametres.delete.errorConfirm")}</Notice>
            )}
            {deleting && error === "wrongPassword" && (
              <Notice tone="err">{t("parametres.delete.errorPassword")}</Notice>
            )}
            <DeleteAccountFields
              word={t("parametres.delete.word")}
              exportHref="/app/parametres/export"
              needsPassword={Boolean(credential?.password)}
              labels={{
                export: t("parametres.delete.export"),
                exportHint: t("parametres.delete.exportHint"),
                type: t("parametres.delete.type"),
                password: t("parametres.delete.password"),
                confirm: t("parametres.delete.confirm"),
                cancel: t("parametres.delete.cancel"),
              }}
            />
          </form>
        )}
      </Sheet>
    </div>
  );
}
