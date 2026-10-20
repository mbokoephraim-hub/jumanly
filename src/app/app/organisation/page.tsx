import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrgBanner } from "@/components/jobs/org-banner";
import { OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { CompanyLogo } from "@/components/ui/avatar";
import { countryName } from "@/config/countries";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { organizationCategories, seatUsage } from "@/server/services/organization";
import { organizationSizes } from "@/server/services/recruiter-account";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org");
  return { title: t("title"), robots: { index: false } };
}

/** The tabs of the page before the redesign, now pages of their own (old links, e-mails). */
const oldTabs: Record<string, string> = {
  profil: "/app/organisation/modifier",
  verification: "/app/organisation/verification",
  membres: "/app/organisation/equipe",
  equipes: "/app/organisation/structure?onglet=equipes",
  departements: "/app/organisation/structure?onglet=departements",
  entites: "/app/organisation/structure?onglet=entites",
};

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Organisation (planche recruteur-3 `ORG_P`, r3plus): the card with the banner, the logo, the
 * name, the line and the verification; four figures of the organization; the presentation; an
 * Orbi line on what makes the page better; then the team, the verification and the structure.
 * Everything is read through the member's organization (golden rule n° 6).
 */
export default async function OrganizationPage({ searchParams }: PageProps<"/app/organisation">) {
  const params = await searchParams;
  const old = oldTabs[one(params.onglet)];
  if (old) redirect(old);
  const { ctx } = await requireHire("/app/organisation");
  const t = await getTranslations("org");
  const tr = await getTranslations("rhOrg");
  const tw = await getTranslations("hireWelcome.org");
  const admin = hirePermissions(ctx.role).administer;
  const [organization, seats, jobs, applications, hired] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        name: true,
        slug: true,
        banner: true,
        logo: true,
        description: true,
        category: true,
        sector: true,
        size: true,
        city: true,
        country: true,
        website: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    }),
    seatUsage(db, ctx.organizationId),
    db.job.count({ where: { organizationId: ctx.organizationId, status: "published" } }),
    db.application.count({ where: { job: { organizationId: ctx.organizationId } } }),
    db.application.count({
      where: { job: { organizationId: ctx.organizationId }, status: "hired" },
    }),
  ]);
  const meta = [
    organization.category
      ? t(`profile.category.${organization.category as (typeof organizationCategories)[number]}`)
      : null,
    organization.sector,
    organization.size
      ? (organizationSizes as readonly string[]).includes(organization.size)
        ? tw(
            `sizes.s${(organizationSizes as readonly string[]).indexOf(organization.size) + 1}` as "sizes.s1",
          )
        : tr("size", { size: organization.size })
      : null,
    [organization.city, organization.country ? countryName(organization.country) : null]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const verified = organization.verificationStatus === "verified";
  const status = organization.verificationStatus;
  const hint = !organization.banner
    ? "banner"
    : !organization.description
      ? "description"
      : !verified && status !== "pending"
        ? "verify"
        : null;
  const figures = [
    { key: "jobs", value: jobs },
    { key: "applications", value: applications },
    { key: "hired", value: hired },
    { key: "members", value: seats.used },
  ] as const;

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/hire/compte"
        backLabel={tr("back")}
        title={t("title")}
        end={
          admin ? (
            <Link
              href="/app/organisation/modifier"
              className="t-bi t-press"
              aria-label={tr("edit")}
            >
              <TalentIcon name="modifier" size="s" />
            </Link>
          ) : undefined
        }
      />
      {one(params.ok) && <Notice tone="ok">{t("profile.saved")}</Notice>}

      <section className="t-verre t-r5-org" aria-labelledby="r5-org-nom">
        <OrgBanner src={organization.banner} className="t-r5-ban" sizes="560px" />
        <div className="t-r5-org-c">
          <CompanyLogo
            name={organization.name}
            src={organization.logo}
            size="lg"
            className="t-r5-lg"
          />
          <h2 id="r5-org-nom">{organization.name}</h2>
          {meta.length > 0 && <p>{meta.join(" · ")}</p>}
          <span className={cx("t-tag", verified ? "t-vert" : "t-amb")}>
            <TalentIcon name={verified ? "valider" : "horloge"} size="xs" />
            {t(`verification.status.${status}`)}
          </span>
        </div>
      </section>

      <ul className="t-r5-st4" aria-label={tr("figures")}>
        {figures.map((figure, index) => (
          <li key={figure.key} className={`t-r5-s${index + 1}`}>
            <b>{figure.value}</b>
            {tr(`figure.${figure.key}`, { count: figure.value })}
          </li>
        ))}
      </ul>

      <section className="t-verre t-carte t-r5-pres" aria-labelledby="r5-org-pres">
        <h2 id="r5-org-pres">
          <span className="t-cases t-c1" aria-hidden>
            <TalentIcon name="document" size="s" />
          </span>
          {tr("presentation")}
        </h2>
        {organization.description ? (
          <p className="t-r5-pre">{organization.description}</p>
        ) : (
          <p className="t-r5-vide-t">{tr("noDescription")}</p>
        )}
        {organization.website && (
          <a
            href={organization.website}
            rel="noopener noreferrer"
            target="_blank"
            className="t-lien-d"
          >
            {organization.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </section>

      {hint && admin && (
        <OrbiLine
          action={
            <Link
              href={
                hint === "verify" ? "/app/organisation/verification" : "/app/organisation/modifier"
              }
              className="t-bt t-sec t-s t-press"
            >
              {tr(`hint.${hint}.cta`)}
            </Link>
          }
        >
          {tr(`hint.${hint}.text`)}
        </OrbiLine>
      )}

      <ul className="t-verre t-liste t-lignes" aria-label={tr("manage")}>
        <li>
          <Link href="/app/organisation/equipe" className="t-li t-press">
            <span className="t-cases t-c2" aria-hidden>
              <TalentIcon name="candidats" size="s" />
            </span>
            <span className="t-t">
              <b>{tr("team")}</b>
              <span>
                {seats.max < 0
                  ? tr("seatsUnlimited", { used: seats.used })
                  : tr("seats", { used: seats.used, max: seats.max })}
              </span>
            </span>
            <TalentIcon name="suivant" />
          </Link>
        </li>
        <li>
          <Link href="/app/organisation/verification" className="t-li t-press">
            <span className="t-cases t-c3" aria-hidden>
              <TalentIcon name="valider" size="s" />
            </span>
            <span className="t-t">
              <b>{tr("verification")}</b>
              <span>{t(`verification.status.${status}`)}</span>
            </span>
            <TalentIcon name="suivant" />
          </Link>
        </li>
        {admin && (
          <li>
            <Link href="/app/organisation/structure" className="t-li t-press">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="entreprise" size="s" />
              </span>
              <span className="t-t">
                <b>{tr("structure")}</b>
                <span>{tr("structureLine")}</span>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
        )}
      </ul>

      {organization.slug && (
        <Link href={`/entreprises/${organization.slug}`} className="t-bt t-sec t-m t-pl t-press">
          <TalentIcon name="profil" size="s" />
          {tr("asTalent")}
        </Link>
      )}
    </div>
  );
}
