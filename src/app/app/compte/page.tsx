import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TalentAvatar } from "@/components/talent/avatar";
import { InstallApp } from "@/components/site/install-app";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { AI_CREDITS_KEY } from "@/server/ai";
import { signOut } from "@/server/actions/auth";
import { switchSpace } from "@/server/actions/hire";
import { ADMIN_ROLES, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan, usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { connectionCounts } from "@/server/services/connections";
import { completeness, getFullProfile } from "@/server/services/profile";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { isTester } from "@/server/services/tester";

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("compte");
  return { title: t("seo"), robots: { index: false } };
}

function Row({
  href,
  icon,
  tone,
  tile,
  title,
  text,
}: {
  href: string;
  icon: TalentIconName;
  tone?: "t-c1" | "t-c2" | "t-c3";
  /** Its colour as a tile of the web page (planche web4 `.cpt-g .k1` to `.k4`). */
  tile?: "t-w4-k1" | "t-w4-k2" | "t-w4-k3" | "t-w4-k4";
  title: string;
  text?: string;
}) {
  return (
    <li className={tile}>
      <Link href={href} className="t-li t-press">
        <span className={cx("t-cases", tone)} aria-hidden>
          <TalentIcon name={icon} size="s" />
        </span>
        <span className="t-t">
          <b>{title}</b>
          {text && <span>{text}</span>}
        </span>
        <TalentIcon name="suivant" />
      </Link>
    </li>
  );
}

const List = ({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <ul aria-label={label} className={cx("t-verre t-liste t-lignes", className)}>
    {children}
  </ul>
);

/** The three steps of Safari on iPhone, in a sheet of the talent space (« Installer l'appli »). */
function InstallSteps({
  t,
  id,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"system.install">>>;
  id: string;
}) {
  return (
    <>
      <div className="t-poignee" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-t`}>{t("ios.title")}</h2>
        <form method="dialog">
          <button type="submit" className="t-bi t-press" aria-label={t("ios.close")}>
            <TalentIcon name="fermer" size="s" />
          </button>
        </form>
      </div>
      <p className="t-ss">{t("ios.intro")}</p>
      <ol aria-label={t("ios.steps")} className="t-verre t-liste">
        {(["step1", "step2", "step3"] as const).map((key, index) => (
          <li key={key} className="t-li" style={{ paddingBlock: 12 }}>
            <span className="t-num t-ok" aria-hidden>
              {index + 1}
            </span>
            <span className="t-t">
              {/* The steps are read in full: no ellipsis as in the other rows. */}
              <b style={{ whiteSpace: "normal" }}>{t(`ios.${key}.title`)}</b>
              <span style={{ whiteSpace: "normal" }}>{t(`ios.${key}.text`)}</span>
            </span>
          </li>
        ))}
      </ol>
      <form method="dialog">
        <button type="submit" className="t-bt t-p t-pl t-press">
          {t("ios.done")}
        </button>
      </form>
    </>
  );
}

/**
 * Compte (planche talent-4 § 2, web : planche web talent-4 § 3), opened by the avatar: the person
 * and their profile, what they keep (CV, attestations, practice, connections), then the
 * subscription, the settings and help. On a computer: the person with the ring of the profile,
 * four tiles, then the settings beside « Se déconnecter ». The organization and partner spaces
 * keep their own pages.
 */
export default async function AccountPage() {
  const user = await requireUser("/app/compte");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations("compte");
  const tW = await getTranslations("talentW4");
  const tProfile = await getTranslations("profil");
  const tInstall = await getTranslations("system.install");
  const subject = { type: "user" as const, id: user.id };
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [profile, cvs, letters, attestations, practice, connections, plan, credits, spaces] =
    await Promise.all([
      getFullProfile(db, user.id),
      db.document.count({ where: { profile: { userId: user.id }, kind: "cv" } }),
      db.document.count({ where: { profile: { userId: user.id }, kind: "cover_letter" } }),
      db.certificate.count({ where: { enrollment: { userId: user.id } } }),
      db.interviewSession.count({ where: { userId: user.id, createdAt: { gte: monthStart } } }),
      connectionCounts(db, user.id),
      resolvePlan(db, subject),
      usage(db, subject, AI_CREDITS_KEY),
      Promise.all([hireMemberships(db, user.id), partnerMemberships(db, user.id)]).then(
        ([hire, partner]) => [...hire, ...partner],
      ),
    ]);
  const creditsLine =
    credits.limit < 0
      ? t("plan.unlimited")
      : t("plan.credits", { count: Math.max(0, credits.limit - credits.used) });
  const admin = (ADMIN_ROLES as readonly string[]).includes(user.platformRole);
  const percent = completeness(profile).percent;
  const role = profile.headline || profile.desiredJobTitles[0];
  const place = [role, user.city].filter(Boolean).join(" · ");

  return (
    <div className="t-flux t-w4 t-large">
      <FlowHead back="/app" backLabel={t("back")} title={t("title")} />

      <Link href="/app/profil" className="t-verre t-hub-id t-w4-id t-press">
        <TalentAvatar name={user.name} image={user.image} />
        <span className="t-t">
          <b>{user.name}</b>
          <span className="t-w4-tel">{t("profile", { percent })}</span>
          <span className="t-w4-web">
            {place ? tW("account.line", { place }) : tW("account.lineAlone")}
          </span>
        </span>
        <span className="t-anneau t-w4-web" style={{ "--p": percent } as CSSProperties}>
          <b>{tProfile("completeness.ring", { percent })}</b>
        </span>
        <span className="t-bt t-p t-m t-w4-web">{tW("account.profile")}</span>
        <TalentIcon name="suivant" size="s" className="t-w4-tel" />
      </Link>

      <List label={t("group.mine")} className="t-w4-tuiles">
        <Row
          href="/app/career/cv"
          icon="cv"
          tone="t-c2"
          tile="t-w4-k2"
          title={t("documents.title")}
          text={t("documents.text", { cvs, letters })}
        />
        <Row
          href="/app/learn/mes-formations?vue=attestations"
          icon="certificat"
          tone="t-c1"
          tile="t-w4-k1"
          title={t("attestations.title")}
          text={t("attestations.text", { count: attestations })}
        />
        <Row
          href="/app/career/entretiens"
          icon="entretien"
          tone="t-c1"
          tile="t-w4-k3"
          title={t("practice.title")}
          text={t("practice.text", { count: practice })}
        />
        <Row
          href="/app/compte/connexions"
          icon="connexion"
          tone="t-c3"
          tile="t-w4-k4"
          title={t("connections.title")}
          text={
            connections.received > 0
              ? t("connections.requests", {
                  count: connections.accepted,
                  received: connections.received,
                })
              : t("connections.text", { count: connections.accepted })
          }
        />
      </List>

      <div className="t-w4-g2e">
        <div className="t-w4-col">
          <List label={t("group.settings")}>
            <Row
              href="/app/abonnement"
              icon="portefeuille"
              title={t("plan.title")}
              text={[plan?.planName, creditsLine].filter(Boolean).join(" · ")}
            />
            <Row
              href="/app/parametres"
              icon="reglages"
              title={t("settings.title")}
              text={t("settings.text")}
            />
            <Row
              href="/app/compte/aide"
              icon="aide"
              title={t("help.title")}
              text={t("help.text")}
            />
            <InstallApp
              id="t-installer-compte"
              as="li"
              buttonClassName="t-li t-press"
              dialogClassName="t-sheet t-auto"
              trigger={
                <>
                  <span className="t-cases t-c1" aria-hidden>
                    <TalentIcon name="telecharger" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{tInstall("button")}</b>
                    <span>{tInstall("text")}</span>
                  </span>
                  <TalentIcon name="suivant" />
                </>
              }
              steps={<InstallSteps t={tInstall} id="t-installer-compte" />}
            />
          </List>

          {(spaces.length > 0 || isTester(user) || admin) && (
            <List label={t("group.spaces")}>
              {spaces.map((membership) => (
                <li key={membership.organizationId}>
                  <form action={switchSpace}>
                    <input type="hidden" name="space" value={membership.organizationId} />
                    <button type="submit" className="t-li t-press">
                      <span className="t-cases" aria-hidden>
                        <TalentIcon name="entreprise" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{membership.organization.name}</b>
                        <span>
                          {membership.organization.type === "partner"
                            ? t("spaces.partner")
                            : t("spaces.text")}
                        </span>
                      </span>
                      <TalentIcon name="suivant" />
                    </button>
                  </form>
                </li>
              ))}
              {isTester(user) && (
                <Row
                  href="/app/testeur"
                  icon="portefeuille"
                  title={t("tester.title")}
                  text={t("tester.text")}
                />
              )}
              {admin && (
                <Row href="/admin" icon="cadenas" title={t("admin.title")} text={t("admin.text")} />
              )}
            </List>
          )}
        </div>

        <div className="t-w4-col">
          <form action={signOut} className="t-verre t-liste">
            <button type="submit" className="t-li t-danger t-press">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="deconnexion" size="s" />
              </span>
              <span className="t-t">
                <b>{t("logout")}</b>
              </span>
            </button>
          </form>
          <p className="t-gar t-w4-web">
            <TalentIcon name="message" size="s" />
            <span>{tW("account.contact", { email: CONTACT_EMAIL })}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
