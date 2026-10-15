import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Initials, MenuChip, QuotaLine, menuItem } from "@/components/hire/kit";
import { tag } from "@/components/jobs/talent-kit";
import { ScoreButton, WhyPopover } from "@/components/matching/why-popover";
import { Alert, EmptyState, PlanLock, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import { contactRequestAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { allowAttempt, authLimits } from "@/server/rate-limit";
import { cheapestPlanWhere, levelOf, listPublicPlans, orgPlanFor } from "@/server/services/plans";
import {
  CONTACT_MESSAGE_MIN,
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
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const filterChip =
  "inline-flex h-10 items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme group-open/menu:bg-creme";
const filterChipOn =
  "inline-flex h-10 items-center gap-1.5 rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc";

/**
 * « Rechercher des talents » (partie 07 § 4, mockup 04-06): only talents who chose to be visible.
 * Each new query uses one search of the monthly quota; there is no export of profiles. The
 * contact request opens beside the results; the talent decides whether to answer.
 */
export default async function TalentSearchPage({ searchParams }: PageProps<"/app/hire/talents">) {
  const params = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/talents", "manage");
  const t = await getTranslations();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [searchLevel, matchingLevel, plans, jobs] = await Promise.all([
    level(db, subject, "hire.talent_search"),
    level(db, subject, "hire.matching.level"),
    listPublicPlans(db),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: { in: ["published", "draft"] } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
  ]);
  const eyebrow = t("hire.pipeline.eyebrow", { org: space.organization.name });

  if (searchLevel === "none") {
    return (
      <div className="jm-page flex flex-col gap-5">
        <AppPageHeader
          eyebrow={eyebrow}
          title={t("hire.talents.title")}
          subtitle={t("hire.talents.subtitle")}
        />
        <PlanLock
          plan={orgPlanFor(plans, "hire.talent_search", ["advanced", "deep"])}
          description={t("hire.talents.locked.body")}
        />
      </div>
    );
  }

  const deep = searchLevel === "deep";
  const explainable = matchingLevel === "explainable";
  const explainPlan = explainable
    ? null
    : (cheapestPlanWhere(
        plans,
        ["rh", "company"],
        (plan) => levelOf(plan, "hire.matching.level") === "explainable",
      )?.name ?? null);
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
  const remaining =
    quotas.contacts.limit < 0
      ? "∞"
      : String(Math.max(0, quotas.contacts.limit - quotas.contacts.used));
  const any = t("hire.talents.filter.any");
  const hrefWith = (changes: Record<string, string | null>) => {
    const query = new URLSearchParams(Object.entries(raw).filter(([, value]) => value !== ""));
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) query.delete(key);
      else query.set(key, value);
    }
    const text = query.toString();
    return text ? `/app/hire/talents?${text}` : "/app/hire/talents";
  };
  const pageHref = (page: number) => hrefWith({ page: String(page), contact: null });
  const contactFor =
    result.status === "ok"
      ? result.results.find(
          (talent) => talent.profileId === raw.contact && talent.contact !== "accepted",
        )
      : undefined;
  const jobTitle = jobs.find((job) => job.id === raw.job)?.title;
  const deepCount = deepFilters.filter((key) => raw[key]).length;
  const titleOf = (talent: { anonymous: boolean; name: string | null; headline: string }) =>
    talent.anonymous
      ? t("hire.talents.result.anonymous", { headline: talent.headline })
      : [talent.name, talent.headline].filter(Boolean).join(" · ");
  const quotaValue = (used: number, max: number) =>
    max < 0 ? t("hire.talents.quota.unlimited") : t("hire.talents.quota.value", { used, max });

  const deepSelect = (
    key: (typeof deepFilters)[number],
    label: string,
    control: React.ReactNode,
  ) => (
    <MenuChip
      key={key}
      group="talent-filters"
      summaryClassName={raw[key] ? filterChipOn : filterChip}
      summary={
        <>
          {label}
          <Icon name="chev-d" className="size-3.5" />
        </>
      }
    >
      <div className="flex w-64 flex-col gap-3 p-2">
        {control}
        <button type="submit" className={pillClass("dark", "sm", "self-start")}>
          {t("hire.pipeline.filter.apply")}
        </button>
      </div>
    </MenuChip>
  );

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={eyebrow}
        title={t("hire.talents.title")}
        subtitle={t("hire.talents.subtitle")}
        actions={
          jobs.length > 0 ? (
            <MenuChip
              group="talent-job"
              align="right"
              summaryClassName={pillClass("lime", "md")}
              summary={
                <>
                  <Icon name="jobs" className="size-4" />
                  <span className="max-w-56 truncate">
                    {jobTitle ?? t("hire.talents.search.fromJob")}
                  </span>
                </>
              }
            >
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={hrefWith({ job: job.id, page: null, contact: null })}
                  aria-current={job.id === raw.job ? "true" : undefined}
                  className={cx(menuItem, "aria-[current=true]:font-semibold")}
                >
                  {job.id === raw.job && <Icon name="check" />}
                  <span className="truncate">{job.title}</span>
                </Link>
              ))}
              {raw.job && (
                <Link href={hrefWith({ job: null, page: null })} className={menuItem}>
                  {t("hire.talents.filter.job.none")}
                </Link>
              )}
            </MenuChip>
          ) : undefined
        }
      />

      <form method="get" className="flex flex-col gap-3">
        {raw.job && <input type="hidden" name="job" value={raw.job} />}
        <div className="flex flex-col gap-2 rounded-[24px] bg-blanc p-2 lg:flex-row lg:items-center lg:rounded-pill">
          <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <Icon name="recherche" className="size-5 shrink-0" />
            <span className="sr-only">{t("hire.talents.filter.skills")}</span>
            <input
              id="talents-q"
              name="q"
              maxLength={100}
              defaultValue={raw.q}
              placeholder={t("hire.talents.search.placeholder")}
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ardoise"
            />
          </label>
          <label className="flex min-w-0 items-center gap-3 border-gris-clair px-3 max-lg:border-t lg:w-72 lg:border-l">
            <Icon name="localisation" className="size-5 shrink-0" />
            <span className="sr-only">{t("hire.talents.search.location")}</span>
            <input
              id="talents-location"
              name="location"
              maxLength={80}
              defaultValue={raw.location}
              placeholder={t("hire.talents.search.location")}
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ardoise"
            />
          </label>
          <button type="submit" className={pillClass("dark", "md", "h-12 px-6")}>
            {t("hire.talents.search.submit")}
          </button>
        </div>
        {deep ? (
          <div className="flex flex-wrap items-center gap-2">
            {deepSelect(
              "experience",
              t("hire.talents.filter.experience"),
              <TextField
                id="talents-experience"
                name="experience"
                type="number"
                min={0}
                max={40}
                label={t("hire.talents.filter.experienceMin")}
                defaultValue={raw.experience}
              />,
            )}
            {deepSelect(
              "remote",
              t("hire.talents.filter.remote"),
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
              />,
            )}
            {deepSelect(
              "contract",
              t("hire.talents.filter.contract"),
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
              />,
            )}
            {deepSelect(
              "language",
              t("hire.talents.filter.languages"),
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
              />,
            )}
            {deepSelect(
              "education",
              t("hire.talents.filter.education"),
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
              />,
            )}
            {deepSelect(
              "availability",
              t("hire.talents.filter.availability"),
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
              />,
            )}
            <label
              className={cx(
                raw.certificates === "1" ? filterChipOn : filterChip,
                "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sapin",
              )}
            >
              <input
                type="checkbox"
                name="certificates"
                value="1"
                defaultChecked={raw.certificates === "1"}
                className="peer sr-only"
              />
              <Icon name="certificat" className="size-4" />
              {t("hire.talents.filter.certificates")}
            </label>
            {deepCount > 0 && (
              <Link
                href={hrefWith(Object.fromEntries(deepFilters.map((key) => [key, null])))}
                className="px-2 text-[12px] font-medium text-ardoise underline"
              >
                {t("hire.pipeline.filter.reset")}
              </Link>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-[12px] text-ardoise">
            <Icon name="lock" className="size-3.5" />
            {t("hire.talents.filter.deep.locked", {
              plan: orgPlanFor(plans, "hire.talent_search", ["deep"]),
            })}
          </p>
        )}
      </form>

      <p className="flex items-center gap-2.5 rounded-[18px] bg-blanc px-5 py-3 text-[13px] leading-[18px] lg:rounded-pill">
        <Icon name="statistiques" className="size-4 shrink-0" />
        {quotaLine}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-3">
          {result.status === "empty" && (
            <p className="rounded-[24px] bg-blanc p-6 text-[14px] text-ardoise">
              {t("hire.talents.start")}
            </p>
          )}
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
            <section aria-labelledby="resultats" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="resultats" className="text-[20px] font-semibold tracking-[-0.015em]">
                  {t("hire.talents.results", { count: result.total })}
                </h2>
                {result.jobTitle && (
                  <span className="text-[12px] text-ardoise">
                    {t("hire.talents.sort", { value: t("hire.talents.sortScore") })}
                  </span>
                )}
              </div>
              {result.total >= SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES && (
                <p className="text-[12px] text-ardoise">
                  {t("hire.talents.capped", { max: SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES })}
                </p>
              )}
              {result.results.length === 0 ? (
                <EmptyState title={t("hire.talents.empty")} />
              ) : (
                <ul className="flex flex-col gap-3">
                  {result.results.map((talent) => {
                    const profileHref = `/app/hire/talents/${talent.profileId}${raw.job ? `?offre=${raw.job}` : ""}`;
                    const selected = contactFor?.profileId === talent.profileId;
                    return (
                      <li
                        key={talent.profileId}
                        className={cx(
                          "flex flex-col gap-3 rounded-[24px] bg-blanc p-4 lg:flex-row lg:gap-4 lg:p-5",
                          selected && "ring-2 ring-sapin",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 gap-3.5">
                          {talent.anonymous ? (
                            <span
                              aria-hidden
                              className="grid size-11 shrink-0 place-items-center rounded-full bg-gris-clair"
                            >
                              <Icon name="profil" className="size-5 text-ardoise" />
                            </span>
                          ) : (
                            <Initials name={talent.name ?? "?"} size={44} />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex flex-col">
                              <p className="text-[15px] leading-5 font-semibold">
                                {titleOf(talent)}
                              </p>
                              {talent.city && (
                                <p className="text-[12px] text-ardoise">{talent.city}</p>
                              )}
                            </div>
                            <p className="flex items-center gap-1.5 text-[12px] text-ardoise">
                              <Icon name="career" className="size-3.5" />
                              {t("hire.talents.result.experience", { years: talent.years })}
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                              {talent.skills.map((skill) => (
                                <li
                                  key={skill}
                                  className="rounded-pill bg-gris-clair px-2.5 py-1 text-[11.5px] font-semibold"
                                >
                                  {skill}
                                </li>
                              ))}
                              {talent.certified && (
                                <li className={cx(tag, "bg-menthe-claire text-menthe-texte")}>
                                  <Icon name="certificat" className="size-3" />
                                  {t("hire.pipeline.card.certificate")}
                                </li>
                              )}
                            </ul>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {talent.contact === "pending" ? (
                                <span className={cx(tag, "h-9 bg-lime px-3.5 text-[12.5px]")}>
                                  <Icon name="horloge" className="size-3.5" />
                                  {t("hire.talents.result.contacted")}
                                </span>
                              ) : talent.contact === "accepted" ? (
                                <span className={cx(tag, "h-9 bg-lime-clair px-3.5 text-[12.5px]")}>
                                  <Icon name="check" className="size-3.5" />
                                  {t("hire.talents.result.connected")}
                                </span>
                              ) : (
                                <Link
                                  href={`${hrefWith({ contact: talent.profileId })}#mise-en-relation`}
                                  className={pillClass("dark", "sm")}
                                >
                                  <Icon name="connect" className="size-4" />
                                  {t("hire.talents.result.contact")}
                                </Link>
                              )}
                              <Link href={profileHref} className={pillClass("outline", "sm")}>
                                {t("hire.talents.result.view")}
                              </Link>
                              <Link
                                href={`${profileHref}#t-pool`}
                                className={pillClass("outline", "sm", "max-sm:hidden")}
                              >
                                <Icon name="favori" className="size-4" />
                                {t("hire.talents.result.addToPool")}
                              </Link>
                            </div>
                          </div>
                        </div>
                        {talent.explanation && result.jobTitle && (
                          <div className="flex shrink-0 flex-row items-center gap-2 lg:max-w-56 lg:flex-col lg:items-end">
                            <ScoreButton
                              large
                              id={talent.profileId}
                              score={t("ui.percent", { value: talent.explanation.score })}
                              aria={t("ai.card.why")}
                            />
                            <span className="flex-1 text-[11.5px] leading-4 text-ardoise lg:flex-none lg:text-right">
                              {t("hire.talents.result.score", {
                                score: talent.explanation.score,
                                jobTitle: result.jobTitle,
                              })}
                            </span>
                            <button
                              type="button"
                              popoverTarget={`why-${talent.profileId}`}
                              className="flex items-center gap-1 text-[12px] font-semibold"
                            >
                              <Icon name="eye" className="size-3.5" />
                              {t("ai.card.why")}
                            </button>
                            <WhyPopover
                              id={talent.profileId}
                              name={titleOf(talent)}
                              match={talent.explanation}
                              explainable={explainable}
                              explainPlan={explainPlan}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {result.pages > 1 && (
                <nav
                  aria-label={t("hire.talents.page.current", {
                    page: result.page,
                    pages: result.pages,
                  })}
                  className="flex flex-wrap items-center justify-center gap-3"
                >
                  {result.page > 1 && (
                    <Link
                      href={pageHref(result.page - 1)}
                      prefetch={false}
                      className={pillClass("outline", "sm")}
                    >
                      <Icon name="chev-l" className="size-4" />
                      {t("hire.talents.page.previous")}
                    </Link>
                  )}
                  <span className="text-[12px] text-ardoise">
                    {t("hire.talents.page.current", { page: result.page, pages: result.pages })}
                  </span>
                  {result.page < result.pages && (
                    <Link
                      href={pageHref(result.page + 1)}
                      prefetch={false}
                      className={pillClass("outline", "sm")}
                    >
                      {t("hire.talents.page.next")}
                      <Icon name="chev-r" className="size-4" />
                    </Link>
                  )}
                </nav>
              )}
              <p className="flex items-start gap-2 rounded-[18px] bg-blanc px-4 py-3 text-[12px] leading-[17px] text-ardoise">
                <Icon name="lock" className="mt-px size-3.5 shrink-0" />
                {t("hire.talents.profile.limited")}
              </p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {contactFor && (
            <section
              id="mise-en-relation"
              aria-labelledby="contact-title"
              className="flex scroll-mt-24 flex-col gap-3.5 rounded-[24px] bg-blanc p-5 ring-2 ring-sapin lg:p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 id="contact-title" className="text-[20px] leading-6 font-semibold">
                  {t("hire.contact.title")}
                </h2>
                <Link
                  href={hrefWith({ contact: null })}
                  aria-label={t("common.close")}
                  className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-creme"
                >
                  <Icon name="fermer" className="size-4" />
                </Link>
              </div>
              <p className="text-[13px] leading-[19px] text-ardoise">
                {t("hire.contact.subtitle")}
              </p>
              <div className="flex items-center gap-3 rounded-[16px] bg-creme px-3.5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blanc">
                  <Icon name="profil" className="size-4 text-ardoise" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-[13.5px] font-semibold">{titleOf(contactFor)}</p>
                  <p className="truncate text-[11.5px] text-ardoise">
                    {[
                      contactFor.city,
                      t("hire.talents.result.experience", { years: contactFor.years }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {contactFor.score !== null && (
                  <span className="inline-flex h-7 items-center gap-1 rounded-pill bg-gradient-ai px-2.5 text-[12px] font-bold text-blanc">
                    {t("ui.percent", { value: contactFor.score })}
                  </span>
                )}
              </div>
              {contactFor.anonymous && (
                <p className="flex gap-2 text-[12px] leading-[17px] text-ardoise">
                  <Icon name="lock" className="mt-px size-3.5 shrink-0" />
                  {t("hire.talents.profile.anonymousNote")}
                </p>
              )}
              <form action={contactRequestAction} className="flex flex-col gap-3.5">
                <input type="hidden" name="profile" value={contactFor.profileId} />
                <Select
                  id="contact-job"
                  name="job"
                  label={t("hire.contact.job.text")}
                  placeholder={t("hire.contact.job.none")}
                  defaultValue={raw.job ?? ""}
                  options={jobs.map((job) => ({ value: job.id, label: job.title }))}
                />
                <TextArea
                  id="contact-message"
                  name="message"
                  required
                  minLength={CONTACT_MESSAGE_MIN}
                  maxLength={2000}
                  rows={5}
                  label={t("hire.contact.message.text")}
                  placeholder={t("hire.contact.message.placeholder")}
                  hint={t("hire.contact.message.min", { min: CONTACT_MESSAGE_MIN })}
                />
                <p className="flex gap-2 rounded-[16px] bg-lime-clair px-4 py-3 text-[12px] leading-[17px]">
                  <Icon name="connect" className="mt-px size-4 shrink-0" />
                  {t("hire.contact.cost", { remaining })}
                </p>
                <button type="submit" className={pillClass("lime", "md", "w-full")}>
                  {t("hire.contact.send")}
                  <Icon name="send" className="size-4" />
                </button>
                <p className="text-[12px] leading-[17px] text-down-texte">
                  {t("hire.contact.noPayment")}
                </p>
              </form>
            </section>
          )}
          <section
            aria-labelledby="talent-quotas"
            className="flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5 lg:p-6"
          >
            <h2 id="talent-quotas" className="text-[16px] font-semibold">
              {t("hire.talents.quota.title")}
            </h2>
            <QuotaLine
              icon="recherche"
              label={t("hire.talents.quota.searches")}
              used={quotas.searches.used}
              max={quotas.searches.limit}
              value={quotaValue(quotas.searches.used, quotas.searches.limit)}
            />
            <QuotaLine
              icon="connect"
              label={t("hire.talents.quota.contacts")}
              used={quotas.contacts.used}
              max={quotas.contacts.limit}
              value={quotaValue(quotas.contacts.used, quotas.contacts.limit)}
            />
            <p className="text-[11.5px] leading-4 text-ardoise">
              {t("hire.talents.quota.renewal", { date: quotas.searches.resetsAt })}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
