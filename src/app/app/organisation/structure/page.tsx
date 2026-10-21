import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EntitiesTab, TeamsTab } from "@/components/org/structure-tabs";
import { FlowHead } from "@/components/talent/flow-head";
import { Notice } from "@/components/talent/notice";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { listMembers } from "@/server/services/organization";
import { orgStructure } from "@/server/services/org-structure";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhOrg");
  return { title: t("structure"), robots: { index: false } };
}

const tabs = ["equipes", "departements", "entites"] as const;
type Tab = (typeof tabs)[number];
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Teams, departments and entities of the organization (`org.teams`, `org.entities`). Their own
 * screens belong to step 3 of the redesign (company administration, web only): until then the
 * forms of before are kept here, under the recruiter's head.
 */
export default async function OrganizationStructurePage({
  searchParams,
}: PageProps<"/app/organisation/structure">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/organisation/structure", "administer");
  const t = await getTranslations("org");
  const tr = await getTranslations("rhOrg");
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
    <div className="t-flux t-w4 t-large">
      <FlowHead back="/app/organisation" backLabel={tr("editBack")} title={tr("structure")} />
      <nav aria-label={tr("structure")} className="t-rx-onglets">
        {tabs.map((item) => (
          <Link
            key={item}
            href={`/app/organisation/structure?onglet=${item}`}
            aria-current={item === tab ? "page" : undefined}
            className="t-puce t-press"
          >
            {label[item]}
          </Link>
        ))}
      </nav>
      {ok === "cree" && <Notice tone="ok">{t("structure.created")}</Notice>}
      {ok === "supprime" && <Notice tone="ok">{t("structure.deleted")}</Notice>}
      {error && (
        <Notice tone="err">
          {error === "notEmpty" ? t("structure.notEmpty") : t("structure.invalid")}
        </Notice>
      )}
      {tab === "entites" ? (
        <EntitiesTab
          structure={structure}
          admin
          lockedPlan={entitiesOn ? null : orgPlanFor(plans, "org.entities")}
        />
      ) : (
        <TeamsTab
          kind={tab === "equipes" ? "team" : "department"}
          structure={teamsOn ? structure : null}
          members={members}
          admin
          entities={entitiesOn}
          lockedPlan={teamsOn ? null : orgPlanFor(plans, "org.teams")}
        />
      )}
    </div>
  );
}
