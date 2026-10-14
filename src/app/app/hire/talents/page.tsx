import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState, PlanLock, Select, TextField } from "@/components/ui";
import { languageName } from "@/lib/dates";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { allowAttempt, authLimits } from "@/server/rate-limit";
import { orgPlanFor, listPublicPlans } from "@/server/services/plans";
import {
  deepFilters,
  desiredContracts,
  educationFilters,
  searchLanguages,
  searchQuotas,
  searchTalents,
  SEARCH_MAX_PAGES,
  SEARCH_PAGE_SIZE,
} from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.talents");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * « Rechercher des talents » (partie 07 § 4): only talents who chose to be visible. Each new
 * query uses one search of the monthly quota; there is no export of profiles.
 */
export default async function TalentSearchPage({ searchParams }: PageProps<"/app/hire/talents">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/talents", "manage");
  const t = await getTranslations();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [searchLevel, plans, jobs] = await Promise.all([
    level(db, subject, "hire.talent_search"),
    listPublicPlans(db),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: { in: ["published", "draft"] } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
  ]);

  if (searchLevel === "none") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">{t("hire.talents.title")}</h1>
        <PlanLock
          plan={orgPlanFor(plans, "hire.talent_search", ["advanced", "deep"])}
          description={t("hire.talents.locked.body")}
        />
      </div>
    );
  }

  const deep = searchLevel === "deep";
  const raw = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, one(value)]));
  // A query (not the empty form) counts towards the per-account rate limit (partie 10 § 10.1).
  const asked = Boolean(raw.q || raw.location || raw.job);
  const allowed = !asked || (await allowAttempt("talentSearch", ctx.userId));
  const [result, quotas] = await Promise.all([
    allowed ? searchTalents(db, ctx, raw) : ({ status: "rateLimited" } as const),
    searchQuotas(db, ctx.organizationId),
  ]);
  const quotaLine = t("hire.talents.quota.text", {
    used: quotas.searches.used,
    quota: quotas.searches.limit < 0 ? "∞" : quotas.searches.limit,
    contactsUsed: quotas.contacts.used,
    contactsQuota: quotas.contacts.limit < 0 ? "∞" : quotas.contacts.limit,
  });
  const any = t("hire.talents.filter.any");
  const pageHref = (page: number) => {
    const query = new URLSearchParams(
      Object.entries(raw).filter(([key, value]) => key !== "page" && value !== ""),
    );
    query.set("page", String(page));
    return `/app/hire/talents?${query}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">{t("hire.talents.title")}</h1>
        <p className="text-ardoise">{t("hire.talents.subtitle")}</p>
        <p className="text-sm">{quotaLine}</p>
      </header>

      <form method="get" className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="talents-q"
            name="q"
            maxLength={100}
            label={t("hire.talents.filter.skills")}
            placeholder={t("hire.talents.search.placeholder")}
            defaultValue={raw.q}
          />
          <TextField
            id="talents-location"
            name="location"
            maxLength={80}
            label={t("hire.talents.search.location")}
            defaultValue={raw.location}
          />
          <Select
            id="talents-job"
            name="job"
            label={t("hire.talents.search.fromJob")}
            placeholder={t("hire.talents.filter.job.none")}
            defaultValue={raw.job ?? ""}
            options={jobs.map((job) => ({ value: job.id, label: job.title }))}
          />
        </div>
        {deep ? (
          <details className="rounded-md bg-creme p-4" open={deepFilters.some((key) => raw[key])}>
            <summary className="cursor-pointer font-medium">
              {t("hire.talents.filter.deep.text")}
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                id="talents-experience"
                name="experience"
                type="number"
                min={0}
                max={40}
                label={t("hire.talents.filter.experienceMin")}
                defaultValue={raw.experience}
              />
              <Select
                id="talents-remote"
                name="remote"
                label={t("hire.talents.filter.remote")}
                placeholder={any}
                defaultValue={raw.remote ?? ""}
                options={(["onsite", "hybrid", "remote"] as const).map((value) => ({
                  value,
                  label: t(`talent.profile.preferences.remote.${value}`),
                }))}
              />
              <Select
                id="talents-contract"
                name="contract"
                label={t("hire.talents.filter.contract")}
                placeholder={any}
                defaultValue={raw.contract ?? ""}
                options={desiredContracts.map((value) => ({
                  value,
                  label: t(`talent.profile.preferences.contract.${value}`),
                }))}
              />
              <Select
                id="talents-language"
                name="language"
                label={t("hire.talents.filter.languages")}
                placeholder={any}
                defaultValue={raw.language ?? ""}
                options={searchLanguages.map((code) => ({
                  value: code,
                  label: languageName(code),
                }))}
              />
              <Select
                id="talents-education"
                name="education"
                label={t("hire.talents.filter.education")}
                placeholder={any}
                defaultValue={raw.education ?? ""}
                options={educationFilters
                  .filter((value) => value !== "none")
                  .map((value) => ({
                    value,
                    label: t(`talent.profile.education.level.${value}`),
                  }))}
              />
              <Select
                id="talents-availability"
                name="availability"
                label={t("hire.talents.filter.availability")}
                placeholder={any}
                defaultValue={raw.availability ?? ""}
                options={(["open", "listening"] as const).map((value) => ({
                  value,
                  label: t(`talent.profile.availability.status.${value}`),
                }))}
              />
              <label className="flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  name="certificates"
                  value="1"
                  defaultChecked={raw.certificates === "1"}
                  className="size-5 accent-sapin"
                />
                {t("hire.talents.filter.certificates")}
              </label>
            </div>
          </details>
        ) : (
          <p className="text-sm text-ardoise">
            {t("hire.talents.filter.deep.locked", {
              plan: orgPlanFor(plans, "hire.talent_search", ["deep"]),
            })}
          </p>
        )}
        <Button type="submit" className="self-start">
          {t("hire.talents.search.submit")}
        </Button>
      </form>

      {result.status === "empty" && <p className="text-ardoise">{t("hire.talents.start")}</p>}
      {result.status === "rateLimited" && (
        <Alert
          tone="error"
          title={t("system.error.rateLimit", { seconds: authLimits.talentSearch.window })}
        />
      )}
      {result.status === "quota" && (
        <Alert
          tone="warning"
          title={t("hire.talents.quota.reached.search", { date: result.resetsAt })}
          action={<Link href="/tarifs">{t("hire.talents.quota.upgrade")}</Link>}
        />
      )}
      {result.status === "ok" && (
        <section aria-labelledby="resultats" className="flex flex-col gap-4">
          <h2 id="resultats" className="text-h2">
            {t("hire.talents.results", { count: result.total })}
          </h2>
          {result.total >= SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES && (
            <p className="text-sm text-ardoise">
              {t("hire.talents.capped", { max: SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES })}
            </p>
          )}
          {result.results.length === 0 ? (
            <EmptyState title={t("hire.talents.empty")} />
          ) : (
            <ul className="flex flex-col gap-3">
              {result.results.map((talent) => (
                <li
                  key={talent.profileId}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-card bg-blanc p-5"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-semibold">
                      {talent.anonymous
                        ? t("hire.talents.result.anonymous", { headline: talent.headline })
                        : [talent.name, talent.headline].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm text-ardoise">
                      {[talent.city, t("hire.talents.result.experience", { years: talent.years })]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {talent.skills.length > 0 && (
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {talent.skills.map((skill) => (
                          <li key={skill}>
                            <Badge tone="jobs">{skill}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    {talent.score !== null && result.jobTitle && (
                      <p className="text-sm font-medium">
                        {t("hire.talents.result.score", {
                          score: talent.score,
                          jobTitle: result.jobTitle,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {talent.contact === "pending" && (
                      <Badge>{t("hire.talents.result.contacted")}</Badge>
                    )}
                    {talent.contact === "accepted" && (
                      <Badge tone="success">{t("hire.talents.result.connected")}</Badge>
                    )}
                    <Link
                      href={`/app/hire/talents/${talent.profileId}${raw.job ? `?offre=${raw.job}` : ""}`}
                      className="font-medium underline"
                    >
                      {t("hire.talents.result.view")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {result.pages > 1 && (
            <nav
              aria-label={t("hire.talents.page.current", {
                page: result.page,
                pages: result.pages,
              })}
              className="flex flex-wrap items-center gap-4"
            >
              {result.page > 1 && (
                <Link href={pageHref(result.page - 1)} prefetch={false} className="underline">
                  {t("hire.talents.page.previous")}
                </Link>
              )}
              <span className="text-sm text-ardoise">
                {t("hire.talents.page.current", { page: result.page, pages: result.pages })}
              </span>
              {result.page < result.pages && (
                <Link href={pageHref(result.page + 1)} prefetch={false} className="underline">
                  {t("hire.talents.page.next")}
                </Link>
              )}
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
