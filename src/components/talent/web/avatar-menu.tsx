import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/server/actions/auth";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { connectionCounts } from "@/server/services/connections";
import { TalentAvatar } from "../avatar";
import { TalentIcon, type TalentIconName } from "../icon";

function Item({
  href,
  icon,
  label,
  note,
}: {
  href: string;
  icon: TalentIconName;
  label: string;
  note?: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="t-press">
        <span aria-hidden className="t-cases">
          <TalentIcon name={icon} size="s" />
        </span>
        <span>{label}</span>
        {note !== undefined && note !== null && note !== "" && <small>{note}</small>}
      </Link>
    </li>
  );
}

/**
 * The menu of the avatar of the web top bar (planche talent-4 § 3 `.amenu`): the person and the
 * profile, CV et documents, Attestations, S'entraîner, Connexions, then Abonnement, Paramètres,
 * Aide, then « Se déconnecter ». Streamed by the frame (Suspense): its counts never hold the page.
 */
export async function AvatarMenuContent({
  user,
}: {
  user: { id: string; name: string; image: string | null };
}) {
  const t = await getTranslations("compte");
  const tShell = await getTranslations("talentShell.menu");
  const [profile, cvs, attestations, connections, plan] = await Promise.all([
    db.talentProfile.findUnique({ where: { userId: user.id }, select: { completeness: true } }),
    db.document.count({ where: { profile: { userId: user.id }, kind: "cv" } }),
    db.certificate.count({ where: { enrollment: { userId: user.id } } }),
    connectionCounts(db, user.id),
    resolvePlan(db, { type: "user", id: user.id }),
  ]);
  return (
    <>
      <Link href="/app/profil" className="t-hub-id t-press">
        <TalentAvatar name={user.name} image={user.image} />
        <span className="t-t">
          <b>{user.name}</b>
          <span>{t("profile", { percent: profile?.completeness ?? 0 })}</span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </Link>
      <div aria-hidden className="t-am-sp" />
      <ul>
        <Item
          href="/app/career/cv"
          icon="cv"
          label={t("documents.title")}
          note={tShell("cvs", { count: cvs })}
        />
        <Item
          href="/app/learn/mes-formations?vue=attestations"
          icon="certificat"
          label={t("attestations.title")}
          note={attestations || null}
        />
        <Item href="/app/career/entretiens" icon="entretien" label={t("practice.title")} />
        <Item
          href="/app/compte/connexions"
          icon="connexion"
          label={t("connections.title")}
          note={connections.accepted || null}
        />
      </ul>
      <div aria-hidden className="t-am-sp" />
      <ul>
        <Item
          href="/app/abonnement"
          icon="portefeuille"
          label={t("plan.title")}
          note={plan?.planName}
        />
        <Item href="/app/parametres" icon="reglages" label={t("settings.title")} />
        <Item href="/app/compte/aide" icon="aide" label={t("help.title")} />
      </ul>
      <div aria-hidden className="t-am-sp" />
      <form action={signOut}>
        <button type="submit" className="t-am-dc t-press">
          <span aria-hidden className="t-cases">
            <TalentIcon name="deconnexion" size="s" />
          </span>
          <span>{t("logout")}</span>
        </button>
      </form>
    </>
  );
}
