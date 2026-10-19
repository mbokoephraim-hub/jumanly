import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { TalentAvatar } from "@/components/talent/avatar";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { AI_CREDITS_KEY } from "@/server/ai";
import { signOut } from "@/server/actions/auth";
import { ADMIN_ROLES, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan, usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { connectionCounts } from "@/server/services/connections";
import { completeness, getFullProfile } from "@/server/services/profile";
import { isTester } from "@/server/services/tester";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("compte");
  return { title: t("seo"), robots: { index: false } };
}

function Row({
  href,
  icon,
  tone,
  title,
  text,
}: {
  href: string;
  icon: TalentIconName;
  tone?: "t-c1" | "t-c2" | "t-c3";
  title: string;
  text?: string;
}) {
  return (
    <li>
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

const List = ({ label, children }: { label: string; children: ReactNode }) => (
  <ul aria-label={label} className="t-verre t-liste t-lignes">
    {children}
  </ul>
);

/**
 * Compte (planche talent-4 § 2), opened by the avatar: the person and their profile, what they
 * keep (CV, attestations, practice, connections), then the subscription, the settings and help.
 * The organization and partner spaces keep their own pages.
 */
export default async function AccountPage() {
  const user = await requireUser("/app/compte");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations("compte");
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
      db.membership.count({ where: { userId: user.id, status: "active" } }),
    ]);
  const creditsLine =
    credits.limit < 0
      ? t("plan.unlimited")
      : t("plan.credits", { count: Math.max(0, credits.limit - credits.used) });
  const admin = (ADMIN_ROLES as readonly string[]).includes(user.platformRole);

  return (
    <div className="t-flux">
      <FlowHead back="/app" backLabel={t("back")} title={t("title")} />

      <Link href="/app/profil" className="t-verre t-hub-id t-press">
        <TalentAvatar name={user.name} image={user.image} />
        <span className="t-t">
          <b>{user.name}</b>
          <span>{t("profile", { percent: completeness(profile).percent })}</span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </Link>

      <List label={t("group.mine")}>
        <Row
          href="/app/career/cv"
          icon="cv"
          tone="t-c2"
          title={t("documents.title")}
          text={t("documents.text", { cvs, letters })}
        />
        <Row
          href="/app/learn/mes-formations?vue=attestations"
          icon="certificat"
          tone="t-c1"
          title={t("attestations.title")}
          text={t("attestations.text", { count: attestations })}
        />
        <Row
          href="/app/career/entretiens"
          icon="entretien"
          tone="t-c1"
          title={t("practice.title")}
          text={t("practice.text", { count: practice })}
        />
        <Row
          href="/app/compte/connexions"
          icon="connexion"
          tone="t-c3"
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
        <Row href="/contact" icon="aide" title={t("help.title")} text={t("help.text")} />
      </List>

      {(spaces > 0 || isTester(user) || admin) && (
        <List label={t("group.spaces")}>
          {spaces > 0 && (
            <Row
              href="/app/espace"
              icon="entreprise"
              title={t("spaces.title")}
              text={t("spaces.text")}
            />
          )}
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
    </div>
  );
}
