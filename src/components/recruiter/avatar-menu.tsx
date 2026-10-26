import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { TalentAvatar } from "@/components/talent/avatar";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { signOut } from "@/server/actions/auth";
import { switchSpace } from "@/server/actions/hire";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { recruiterAccountSummary } from "./account-data";

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
export const CONTACT_EMAIL = "assistant@jumanly.io";

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
  const inner = (
    <>
      <span aria-hidden className="t-cases">
        <TalentIcon name={icon} size="s" />
      </span>
      <span>{label}</span>
      {note !== undefined && note !== null && note !== "" && <small>{note}</small>}
    </>
  );
  return (
    <li>
      {href.startsWith("mailto:") ? (
        <a href={href} className="t-press">
          {inner}
        </a>
      ) : (
        <Link href={href} className="t-press">
          {inner}
        </Link>
      )}
    </li>
  );
}

/**
 * The menu of the avatar in the recruiter's top bar (planche web recruteur-3 § 3, « Menu du
 * compte »): the person and their job, Organisation (its verification), Équipe (seats), Viviers,
 * Rapports, then Abonnement, Paramètres, Aide, « Passer à mon espace talent », « Se déconnecter ».
 * The phone keeps its avatar, which opens the Compte RH page. Streamed by the frame (Suspense).
 */
export async function RecruiterAvatarMenu({
  ctx,
  user,
  roleLabel,
}: {
  ctx: HireContext;
  user: { name: string; image: string | null };
  roleLabel: string;
}) {
  const t = await getTranslations("hireAccount");
  const tw = await getTranslations("hireWeb3.menu");
  const summary = await recruiterAccountSummary(ctx);
  return (
    <>
      <Link href="/app/hire/compte" className="t-hub-id t-press">
        <TalentAvatar name={user.name} image={user.image} />
        <span className="t-t">
          <b>{user.name}</b>
          <span>{summary.jobTitle ?? roleLabel}</span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </Link>
      <div aria-hidden className="t-am-sp" />
      <ul>
        {/* Page entreprise and Équipe belong to the owner and the administrators (étape 3). */}
        {hirePermissions(ctx.role).administer && (
          <>
            <Item
              href="/app/organisation"
              icon="entreprise"
              label={t("org.title")}
              note={t(`org.${summary.verification}`)}
            />
            <Item
              href="/app/organisation/equipe"
              icon="candidats"
              label={t("team.title")}
              note={
                summary.seats.max < 0
                  ? summary.seats.used
                  : tw("seats", { used: summary.seats.used, limit: summary.seats.max })
              }
            />
          </>
        )}
        {summary.readsPools && (
          <Item
            href="/app/hire/viviers"
            icon="favori"
            label={t("pools.title")}
            note={summary.talents || null}
          />
        )}
        <Item href="/app/hire/rapports" icon="progression" label={t("reports.title")} />
      </ul>
      <div aria-hidden className="t-am-sp" />
      <ul>
        <Item
          href="/app/abonnement"
          icon="portefeuille"
          label={t("plan.title")}
          note={summary.planName}
        />
        <Item href="/app/parametres" icon="reglages" label={t("settings.title")} />
        <Item href={`mailto:${CONTACT_EMAIL}`} icon="aide" label={t("help.title")} />
        <li>
          <form action={switchSpace}>
            <input type="hidden" name="space" value="personal" />
            <button type="submit" className="t-am-dc t-rw3-am t-press">
              <span aria-hidden className="t-cases">
                <TalentIcon name="profil" size="s" />
              </span>
              <span>{t("talent.title")}</span>
            </button>
          </form>
        </li>
      </ul>
      <div aria-hidden className="t-am-sp" />
      <form action={signOut}>
        <button type="submit" className="t-am-dc t-press">
          <span aria-hidden className="t-cases">
            <TalentIcon name="deconnexion" size="s" />
          </span>
          <span>{t("signOut")}</span>
        </button>
      </form>
    </>
  );
}
