import type { Metadata } from "next";
import { RhCompteScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { isPhone } from "@/server/view";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentAvatar } from "@/components/talent/avatar";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { AI_CREDITS_KEY } from "@/server/ai";
import { signOut } from "@/server/actions/auth";
import { switchSpace } from "@/server/actions/hire";
import { ADMIN_ROLES } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan, usage } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";
import { listPools } from "@/server/services/talent-search";
import { isTester } from "@/server/services/tester";
import { recruiterAccountSummary } from "@/components/recruiter/account-data";

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireAccount");
  return { title: t("seo"), robots: { index: false } };
}

function Row({
  href,
  icon,
  tone,
  tile,
  title,
  text,
  badge,
}: {
  href: string;
  icon: TalentIconName;
  tone?: "t-c1" | "t-c2" | "t-c3";
  /** Its colour as a tile of the web page (planche web recruteur-3 § 3, `.cpt-g`). */
  tile?: string;
  title: string;
  text?: string;
  badge?: ReactNode;
}) {
  const inner = (
    <>
      <span className={cx("t-cases", tone)} aria-hidden>
        <TalentIcon name={icon} size="s" />
      </span>
      <span className="t-t">
        <b>{title}</b>
        {text && <span>{text}</span>}
      </span>
      {badge}
      <TalentIcon name="suivant" />
    </>
  );
  return (
    <li className={tile}>
      {href.startsWith("mailto:") ? (
        <a href={href} className="t-li t-press">
          {inner}
        </a>
      ) : (
        <Link href={href} className="t-li t-press">
          {inner}
        </Link>
      )}
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

/**
 * Compte RH (planche recruteur-3 COMPTE_R), opened by the avatar of the recruiter space: the
 * person and their job title, the organization and its team, the pools and the reports, then
 * the subscription, the settings, help and the way back to the talent space.
 */
export default async function RecruiterAccountPage() {
  const { user, space, ctx } = await requireHire("/app/hire/compte");
  // On a phone, Compte of Modèle B (recruteur M8, planche Recruteur-compte).
  if (await isPhone())
    return (
      <RhCompteTexts>
        <RhCompteScreen ctx={ctx} />
      </RhCompteTexts>
    );
  const t = await getTranslations("hireAccount");
  const tw = await getTranslations("hireWeb3.account");
  const tRoles = await getTranslations("org.roles");
  const tTalent = await getTranslations("compte");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const permissions = hirePermissions(ctx.role);
  const [membership, organization, seats, pools, plan, credits, summary] = await Promise.all([
    db.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: ctx.organizationId } },
      select: { jobTitle: true },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { verificationStatus: true, verifiedAt: true },
    }),
    seatUsage(db, ctx.organizationId),
    permissions.readApplications ? listPools(db, ctx) : Promise.resolve([]),
    resolvePlan(db, subject),
    usage(db, subject, AI_CREDITS_KEY),
    recruiterAccountSummary(ctx),
  ]);
  const org = space.organization.name;
  const verification = organization.verifiedAt
    ? { key: "verified", tone: "t-vert" }
    : organization.verificationStatus === "pending"
      ? { key: "pending", tone: "t-amb" }
      : { key: "toVerify", tone: "t-amb" };
  const talents = pools.reduce((sum, pool) => sum + pool._count.entries, 0);
  const planName = plan?.planName ?? "";
  const admin = (ADMIN_ROLES as readonly string[]).includes(user.platformRole);
  const line = membership?.jobTitle
    ? t("line", { jobTitle: membership.jobTitle, org })
    : t("lineNoTitle", { org });
  const teamText =
    seats.max < 0
      ? t("team.textUnlimited", { used: seats.used })
      : t("team.text", { used: seats.used, limit: seats.max });
  const planText =
    credits.limit < 0
      ? t("plan.textUnlimited", { plan: planName })
      : t("plan.text", { plan: planName, count: Math.max(0, credits.limit - credits.used) });
  const verificationTag = (
    <span className={cx("t-tag", verification.tone)}>
      {t(`org.${verification.key}` as "org.verified")}
    </span>
  );

  return (
    <div className="t-flux t-w4 t-large t-rw3-cpt">
      <FlowHead back="/app/hire" backLabel={t("back")} title={t("title")} />

      {/* Sur ordinateur (planche web recruteur-3 § 3) : la personne avec « Espace talent » et
          « Mon profil RH », puis tout le compte en tuiles. Le téléphone garde ses listes. */}
      <div className="t-verre t-hub-id t-w4-id t-w4-web">
        <TalentAvatar name={user.name} image={user.image} />
        <span className="t-t">
          <b>{user.name}</b>
          <span>{tw("line", { line, role: tRoles(`${space.role}.text`) })}</span>
        </span>
        <form action={switchSpace}>
          <input type="hidden" name="space" value="personal" />
          <button type="submit" className="t-bt t-sec t-m t-press">
            <TalentIcon name="profil" size="s" />
            {tw("talent")}
          </button>
        </form>
        <Link href="/app/hire/compte/profil" className="t-bt t-p t-m t-press">
          {tw("profile")}
        </Link>
      </div>

      <List label={t("group.org")} className="t-w4-tuiles t-rw3-tuiles t-w4-web">
        {/* Page entreprise and Équipe belong to the owner and the administrators (étape 3). */}
        {permissions.administer && (
          <Row
            href="/app/organisation"
            icon="entreprise"
            tile="t-w4-k3"
            title={t("org.title")}
            text={tw("org")}
            badge={verificationTag}
          />
        )}
        {permissions.administer && (
          <Row
            href="/app/organisation/equipe"
            icon="candidats"
            tile="t-w4-k2"
            title={t("team.title")}
            text={teamText}
          />
        )}
        {permissions.readApplications && (
          <Row
            href="/app/hire/viviers"
            icon="favori"
            tile="t-w4-k1"
            title={t("pools.title")}
            text={t("pools.text", { pools: pools.length, talents })}
          />
        )}
        <Row
          href="/app/hire/rapports"
          icon="progression"
          tile="t-w4-k4"
          title={t("reports.title")}
          text={tw("reports", { count: summary.recentApplications })}
        />
        <Row
          href="/app/abonnement"
          icon="portefeuille"
          tile="t-rw3-k5"
          title={t("plan.title")}
          text={planText}
        />
        <Row
          href="/app/parametres"
          icon="reglages"
          tile="t-rw3-k6"
          title={t("settings.title")}
          text={tw("settings")}
        />
      </List>

      <div className="t-w4-g2e t-w4-web">
        <ul aria-label={t("help.title")} className="t-verre t-liste t-lignes">
          <Row
            href={`mailto:${CONTACT_EMAIL}`}
            icon="aide"
            title={t("help.title")}
            text={tw("help", { email: CONTACT_EMAIL })}
          />
          {isTester(user) && (
            <Row
              href="/app/testeur"
              icon="portefeuille"
              title={tTalent("tester.title")}
              text={tTalent("tester.text")}
            />
          )}
          {admin && (
            <Row
              href="/admin"
              icon="cadenas"
              title={tTalent("admin.title")}
              text={tTalent("admin.text")}
            />
          )}
        </ul>
        <form action={signOut} className="t-verre t-liste">
          <button type="submit" className="t-li t-danger t-press w-full text-left">
            <span className="t-cases" aria-hidden>
              <TalentIcon name="deconnexion" size="s" />
            </span>
            <span className="t-t">
              <b>{t("signOut")}</b>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
