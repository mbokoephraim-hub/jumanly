import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EntitiesPanel, TeamsPanel } from "@/components/entreprise/structure";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { listMembers } from "@/server/services/organization";
import { orgStructure } from "@/server/services/org-structure";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

const PAGE = "/app/organisation/structure";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhOrg");
  return { title: t("structure"), robots: { index: false } };
}

const tabs = ["equipes", "departements", "entites"] as const;
type Tab = (typeof tabs)[number];
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Équipes, départements et entités (étape 3, A6), reached from Équipe: the forms of before
 * (`org.teams`, `org.entities`) on the Modèle B, for the owner and the administrators only. The
 * tabs are links (`?onglet=`) and the forms post to the server, so the page needs no script.
 */
export default async function OrganizationStructurePage({
  searchParams,
}: PageProps<"/app/organisation/structure">) {
  const params = await searchParams;
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("org");
  const tr = await getTranslations("rhOrg");
  const ts = await getTranslations("orgStructure");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const tab: Tab = (tabs as readonly string[]).includes(one(params.onglet))
    ? (one(params.onglet) as Tab)
    : "equipes";
  const [{ members }, teamsOn, entitiesOn, plans] = await Promise.all([
    listMembers(db, ctx),
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    listPublicPlans(db),
  ]);
  const structure = teamsOn || entitiesOn ? await orgStructure(db, ctx.organizationId) : null;
  const ok = one(params.ok);
  const error = one(params.erreur);
  const label: Record<Tab, string> = {
    equipes: t("tab.teams"),
    departements: t("tab.departments"),
    entites: t("tab.entities"),
  };

  return (
    <div className="ae-app ae-page">
      <Link href="/app/organisation/equipe" className="ae-lien-doux ae-st-retour">
        {ts("back")}
      </Link>
      <h1 className="ae-h1">{tr("structure")}</h1>
      <p className="ae-meta ae-jr-intro">{ts("intro")}</p>
      <nav aria-label={ts("tabs")}>
        <ul className="ae-pills ae-pills-wrap ae-jr-filtres">
          {tabs.map((item) => (
            <li key={item}>
              <Link
                href={`${PAGE}?onglet=${item}`}
                scroll={false}
                className={cx("ae-pill", item === tab && "ae-pill-on")}
                aria-current={item === tab ? "page" : undefined}
              >
                {label[item]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {(ok === "cree" || ok === "supprime") && (
        <p role="status" className="ae-encadre ae-encadre-lime ae-st-avis">
          {ok === "cree" ? t("structure.created") : t("structure.deleted")}
        </p>
      )}
      {error && (
        <p role="alert" className="ae-encadre ae-st-avis ae-st-erreur">
          {error === "notEmpty" ? t("structure.notEmpty") : t("structure.invalid")}
        </p>
      )}
      {tab === "entites" ? (
        <EntitiesPanel
          structure={entitiesOn ? structure : null}
          lockedPlan={entitiesOn ? null : orgPlanFor(plans, "org.entities")}
        />
      ) : (
        <TeamsPanel
          kind={tab === "equipes" ? "team" : "department"}
          structure={teamsOn ? structure : null}
          members={members}
          entities={entitiesOn}
          lockedPlan={teamsOn ? null : orgPlanFor(plans, "org.teams")}
        />
      )}
    </div>
  );
}
